use axum::{response::{Response}, http::{StatusCode, header}};
use crate::utils::relatorio::{gerar_pdf, gerar_xlsx};
// Adicione as dependências no Cargo.toml:
// printpdf = "0.6" (para PDF)
// umya-spreadsheet = "1.0" (para XLSX)

#[derive(Deserialize)]
pub struct RelatorioTransacoesRequest {
    pub tipo_arquivo: String, // "pdf" ou "xlsx"
    pub filtros: TransacaoFiltro,
}


#[axum::debug_handler]
pub async fn relatorio_transacoes_handler(
    jar: CookieJar,
    Json(req): Json<RelatorioTransacoesRequest>,
) -> Response {
    use crate::schema::transacoes::dsl::*;
    let conn = &mut db::establish_connection();
    let token = jar.get("auth_token").map(|c| c.value().to_string()).unwrap_or_default();
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let claims = decode::<Claims>(token.as_str(), &DecodingKey::from_secret(secret.as_ref()), &Validation::default())
        .map(|token_data| token_data.claims)
        .unwrap_or_else(|_| Claims { sub: "".to_string(), email: "".to_string(), exp: 0 });
    let user_id = claims.sub.clone();

    // Monta query base
    let mut query = transacoes.filter(id_usuario.eq(&user_id)).into_boxed();
    let filtro = req.filtros;
    if let Some(cat) = filtro.id_categoria.clone() {
        query = query.filter(id_categoria.eq(cat));
    }
    if let Some(desc) = filtro.descricao.clone() {
        if !desc.trim().is_empty() {
            query = query.filter(descricao.ilike(format!("%{}%", desc)));
        }
    }
    if let Some(tipo_f) = filtro.tipo.clone() {
        query = query.filter(tipo.eq(tipo_f));
    }
    if let (Some(dt_ini), Some(dt_fim)) = (filtro.data_inicio, filtro.data_fim) {
        query = query.filter(data.ge(dt_ini).and(data.le(dt_fim)));
    } else if let Some(dt_ini) = filtro.data_inicio {
        query = query.filter(data.ge(dt_ini));
    } else if let Some(dt_fim) = filtro.data_fim {
        query = query.filter(data.le(dt_fim));
    }

    let results = query.order(data.desc()).load::<Transacao>(conn).unwrap_or_default();
   
    match req.tipo_arquivo.as_str() {
        "pdf" => {
            let pdf_bytes = gerar_pdf(&results, &user_id, conn);
            Response::builder()
                .status(StatusCode::OK)
                .header(header::CONTENT_TYPE, "application/pdf")
                .header(header::CONTENT_DISPOSITION, "attachment; filename=relatorio.pdf")
                .body(pdf_bytes.into())
                .unwrap()
        },
        "xlsx" => {
            let xlsx_bytes = gerar_xlsx(&results, &user_id, conn);
            Response::builder()
                .status(StatusCode::OK)
                .header(header::CONTENT_TYPE, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                .header(header::CONTENT_DISPOSITION, "attachment; filename=relatorio.xlsx")
                .body(xlsx_bytes.into())
                .unwrap()
        },
        _ => Response::builder().status(StatusCode::BAD_REQUEST).body("Tipo de arquivo inválido".into()).unwrap(),
    }
}
use chrono::NaiveDateTime;

use axum::{Json, extract::Path};
use axum_extra::extract::cookie::CookieJar;
use serde::{Serialize, Deserialize};
use diesel::prelude::*;
use diesel::AsChangeset;
use crate::db;
use crate::schema::transacoes::dsl::*;
use crate::models::Transacao;
use jsonwebtoken::{decode, DecodingKey, Validation};

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub exp: usize,
}

#[cfg(test)]
mod tests {
    use crate::models::categoria::NewCategoria;
    use super::*;
    use crate::db::establish_connection;
    use chrono::Utc;
    use crate::models::usuario::NewUsuario;

    fn clean_db() {
        std::env::set_var("ENVIRONMENT", "tests");
        let conn = &mut establish_connection();
        diesel::delete(crate::schema::transacoes::dsl::transacoes).execute(conn).ok();
        diesel::delete(crate::schema::usuarios::dsl::usuarios).execute(conn).ok();
    }

    // Removido: create_fake_user

    fn fake_payload() -> CreateTransacaoPayload {
        let now = Utc::now().naive_utc();
        CreateTransacaoPayload {
            id_categoria: "cat1".to_string(),
            valor: 123,
            tipo: "entrada".to_string(),
            descricao: Some("Transação de teste".to_string()),
            data: Some(now),
        }
    }

    #[derive(Serialize, serde::Deserialize)]
    struct Claims {
        sub: String,
        email: String,
        exp: usize,
    }

    #[tokio::test]
    async fn test_create_get_and_delete_transacao() {
        std::env::set_var("ENVIRONMENT", "tests");
        clean_db();
        let db_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| "SEM DATABASE_URL".to_string());
        println!("[TESTE] DATABASE_URL em uso: {}", db_url);
        let conn = &mut establish_connection();

        // Cria usuário diretamente
        let now = chrono::Utc::now().naive_utc();
        let user_id = "user_transacao_test".to_string();
        let new_user = NewUsuario {
            id: user_id.clone(),
            nome_usuario: "user_transacao_test".to_string(),
            email: "transacao@teste.com".to_string(),
            senha: "senha123".to_string(),
            nome_completo: "Transacao Teste".to_string(),
            telefone: "11999999999".to_string(),
            veiculo: "Carro".to_string(),
            criado_em: now,
            atualizado_em: now,
            ultima_tentativa_redefinicao: now,
            address: "Rua Teste".to_string(),
            address_number: "123".to_string(),
            complement: "Apto 1".to_string(),
            postal_code: "01234567".to_string(),
            province: "Centro".to_string(),
            city: "São Paulo".to_string(),
            cpfcnpj: "12345678900".to_string(),
        };
        diesel::insert_into(crate::schema::usuarios::dsl::usuarios)
            .values(&new_user)
            .on_conflict(crate::schema::usuarios::dsl::id)
            .do_nothing()
            .execute(conn)
            .expect("Erro ao inserir usuário");
        // Assert usuário criado
        let usuario_existe = crate::schema::usuarios::dsl::usuarios
            .filter(crate::schema::usuarios::dsl::id.eq(&user_id))
            .first::<crate::models::usuario::Usuario>(conn)
            .is_ok();
        assert!(usuario_existe, "Usuário não foi criado corretamente");

        // Cria categoria diretamente
        let categoria_id = "cat1".to_string();
        let new_cat = NewCategoria {
            id: categoria_id.clone(),
            id_usuario: Some(user_id.clone()),
            nome: "Categoria Teste".to_string(),
            tipo: "entrada".to_string(),
            icone: Some("icon.png".to_string()),
            cor: Some("#FFFFFF".to_string()),
            
            criado_em: now,
            atualizado_em: now,
        };
        diesel::insert_into(crate::schema::categorias::dsl::categorias)
            .values(&new_cat)
            .on_conflict(crate::schema::categorias::dsl::id)
            .do_nothing()
            .execute(conn)
            .expect("Erro ao inserir categoria");
        // Assert categoria criada
        let categoria_existe = crate::schema::categorias::dsl::categorias
            .filter(crate::schema::categorias::dsl::id.eq(&categoria_id))
            .first::<crate::models::categoria::Categoria>(conn)
            .is_ok();
        assert!(categoria_existe, "Categoria não foi criada corretamente");

        // Cria transação
        let payload = fake_payload();
        let nova_transacao = crate::models::NewTransacao {
            id: ulid::Ulid::new().to_string(),
            id_usuario: user_id.clone(),
            id_categoria: categoria_id.clone(),
            valor: payload.valor,
            tipo: payload.tipo.clone(),
            descricao: payload.descricao.clone(),
            data: payload.data.unwrap_or(now),
            criado_em: now,
            atualizado_em: now,
        };
        diesel::insert_into(crate::schema::transacoes::dsl::transacoes)
            .values(&nova_transacao)
            .execute(conn)
            .expect("Erro ao inserir transação");
        let transacao_id = nova_transacao.id.clone();
        // Assert transação criada
        let found = crate::schema::transacoes::dsl::transacoes
            .filter(crate::schema::transacoes::dsl::id.eq(&transacao_id))
            .first::<crate::models::Transacao>(conn);
        assert!(found.is_ok(), "Transação não encontrada após inserção");

        // Deleta transação diretamente
        let deleted = diesel::delete(crate::schema::transacoes::dsl::transacoes
            .filter(crate::schema::transacoes::dsl::id.eq(&transacao_id))
            .filter(crate::schema::transacoes::dsl::id_usuario.eq(&user_id)))
            .execute(conn)
            .unwrap_or(0);
        assert!(deleted > 0, "Falha ao deletar transação: usuário do teste = {}", user_id);

        // Assert transação removida
        let found2 = crate::schema::transacoes::dsl::transacoes
            .filter(crate::schema::transacoes::dsl::id.eq(&transacao_id))
            .first::<crate::models::Transacao>(conn);
        assert!(found2.is_err(), "Transação ainda encontrada após deleção");
    }
}
#[derive(Serialize, Deserialize)]
pub struct UpdateTransacaoPayload {
    pub valor: Option<i32>,
    pub tipo: Option<String>,
    pub descricao: Option<String>,
    pub data: Option<chrono::NaiveDateTime>,
}

use crate::schema::transacoes;

#[derive(AsChangeset, Default)]
#[diesel(table_name = transacoes)]
pub struct TransacaoChangeset {
    pub valor: Option<i32>,
    pub tipo: Option<String>,
    pub descricao: Option<String>,
    pub data: Option<chrono::NaiveDateTime>,
}

pub async fn update_transacao_handler(Path(id_param): Path<String>, Json(payload): Json<UpdateTransacaoPayload>) -> Json<Option<TransacaoResponse>> {
    let conn = &mut db::establish_connection();
    let changeset = TransacaoChangeset {
        valor: payload.valor,
        tipo: payload.tipo,
        descricao: payload.descricao,
        data: payload.data,
    };
    diesel::update(transacoes.filter(id.eq(&id_param)))
        .set(changeset)
        .execute(conn)
        .ok();
    match transacoes.filter(id.eq(id_param)).first::<Transacao>(conn) {
        Ok(t) => Json(Some(TransacaoResponse {
            id: t.id,
            id_usuario: t.id_usuario,
            id_categoria: t.id_categoria,
            valor: t.valor,
            tipo: t.tipo,
            descricao: t.descricao,
            data: t.data,
        })),
        Err(_) => Json(None),
    }
}

pub async fn delete_transacao_handler(Path(id_param): Path<String>) -> Json<bool> {
    let conn = &mut db::establish_connection();
    let count = diesel::delete(transacoes.filter(id.eq(id_param))).execute(conn).unwrap_or(0);
    Json(count > 0)
}


#[derive(Deserialize)]
pub struct CreateTransacaoPayload {
    pub id_categoria: String,
    pub valor: i32,
    pub tipo: String,
    pub descricao: Option<String>,
    pub data: Option<chrono::NaiveDateTime>,
}

#[derive(Serialize)]
#[derive(Debug)]
pub struct TransacaoResponse {
    pub id: String,
    pub id_usuario: String,
    pub id_categoria: String,
    pub valor: i32,
    pub tipo: String,
    pub descricao: Option<String>,
    pub data: chrono::NaiveDateTime,
}

pub async fn create_transacao_handler(jar: CookieJar, Json(payload): Json<CreateTransacaoPayload>) -> Json<TransacaoResponse> {
    let conn = &mut db::establish_connection();
    let now: NaiveDateTime = chrono::Utc::now().naive_utc();
    let token = jar.get("auth_token").map(|c| c.value().to_string()).unwrap_or_default();
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let claims = decode::<Claims>(token.as_str(), &DecodingKey::from_secret(secret.as_ref()), &Validation::default())
        .map(|token_data| token_data.claims)
        .unwrap_or_else(|_| Claims { sub: "".to_string(), email: "".to_string(), exp: 0 });
    let user_id = claims.sub.clone();
    let nova_data: NaiveDateTime = payload.data.unwrap_or(now);
    let nova_transacao = crate::models::NewTransacao {
        id: ulid::Ulid::new().to_string(),
        id_usuario: user_id.clone(),
        id_categoria: payload.id_categoria,
        valor: payload.valor,
        tipo: payload.tipo,
        descricao: payload.descricao,
        data: nova_data,
        criado_em: now,
        atualizado_em: now,
    };
    diesel::insert_into(transacoes)
        .values(&nova_transacao)
        .execute(conn)
        .expect("Erro ao inserir transação");
    Json(TransacaoResponse {
        id: nova_transacao.id,
        id_usuario: nova_transacao.id_usuario,
        id_categoria: nova_transacao.id_categoria,
        valor: nova_transacao.valor,
        tipo: nova_transacao.tipo,
        descricao: nova_transacao.descricao,
        data: nova_transacao.data,
    })
}

pub async fn get_transacao_handler(Path(id_param): Path<String>) -> Json<Option<TransacaoResponse>> {
    let conn = &mut db::establish_connection();
    match transacoes.filter(id.eq(id_param)).first::<Transacao>(conn) {
        Ok(t) => Json(Some(TransacaoResponse {
            id: t.id,
            id_usuario: t.id_usuario,
            id_categoria: t.id_categoria,
            valor: t.valor,
            tipo: t.tipo,
            descricao: t.descricao,
            data: t.data,
        })),
        Err(_) => Json(None),
    }
}


#[derive(Deserialize)]
pub struct TransacaoFiltro {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub id_categoria: Option<String>,
    pub descricao: Option<String>,
    pub tipo: Option<String>,
    pub data_inicio: Option<chrono::NaiveDateTime>,
    pub data_fim: Option<chrono::NaiveDateTime>,
}

#[derive(Serialize)]
pub struct PaginatedTransacoes {
    pub total: usize,
    pub page: usize,
    pub page_size: usize,
    pub items: Vec<TransacaoResponse>,
}

#[axum::debug_handler]
pub async fn list_transacoes_handler(
    jar: CookieJar,
    Json(filtro): Json<TransacaoFiltro>,
) -> Json<PaginatedTransacoes> {
    // (nenhum import extra necessário)
    let conn = &mut db::establish_connection();
    let token = jar.get("auth_token").map(|c| c.value().to_string()).unwrap_or_default();
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let claims = decode::<Claims>(token.as_str(), &DecodingKey::from_secret(secret.as_ref()), &Validation::default())
        .map(|token_data| token_data.claims)
        .unwrap_or_else(|_| Claims { sub: "".to_string(), email: "".to_string(), exp: 0 });
    let user_id = claims.sub.clone();

    let page = filtro.page.unwrap_or(1).max(1);
    let page_size = filtro.page_size.unwrap_or(10).clamp(1, 100);
    let offset = (page - 1) * page_size;

    // Monta query base para count
    let mut count_query = transacoes.filter(id_usuario.eq(&user_id)).into_boxed();
    if let Some(ref cat) = filtro.id_categoria {
        count_query = count_query.filter(id_categoria.eq(cat));
    }
    if let Some(ref desc) = filtro.descricao {
        count_query = count_query.filter(descricao.ilike(format!("%{}%", desc)));
    }
    if let Some(ref tipo_f) = filtro.tipo {
        count_query = count_query.filter(tipo.eq(tipo_f));
    }
    if let (Some(dt_ini), Some(dt_fim)) = (filtro.data_inicio, filtro.data_fim) {
        count_query = count_query.filter(data.ge(dt_ini).and(data.le(dt_fim)));
    } else if let Some(dt_ini) = filtro.data_inicio {
        count_query = count_query.filter(data.ge(dt_ini));
    } else if let Some(dt_fim) = filtro.data_fim {
        count_query = count_query.filter(data.le(dt_fim));
    }

    let total: i64 = count_query.count().get_result(conn).unwrap_or(0);

    // Monta query base para busca paginada
    let mut data_query = transacoes.filter(id_usuario.eq(&user_id)).into_boxed();
    if let Some(ref cat) = filtro.id_categoria {
        data_query = data_query.filter(id_categoria.eq(cat));
    }
    if let Some(ref desc) = filtro.descricao {
        data_query = data_query.filter(descricao.ilike(format!("%{}%", desc)));
    }
    if let Some(ref tipo_f) = filtro.tipo {
        data_query = data_query.filter(tipo.eq(tipo_f));
    }
    if let (Some(dt_ini), Some(dt_fim)) = (filtro.data_inicio, filtro.data_fim) {
        data_query = data_query.filter(data.ge(dt_ini).and(data.le(dt_fim)));
    } else if let Some(dt_ini) = filtro.data_inicio {
        data_query = data_query.filter(data.ge(dt_ini));
    } else if let Some(dt_fim) = filtro.data_fim {
        data_query = data_query.filter(data.le(dt_fim));
    }

    let results = data_query
        .order(data.desc())
        .limit(page_size as i64)
        .offset(offset as i64)
        .load::<Transacao>(conn)
        .unwrap_or_default();

    let items = results.into_iter().map(|t| TransacaoResponse {
        id: t.id,
        id_usuario: t.id_usuario,
        id_categoria: t.id_categoria,
        valor: t.valor,
        tipo: t.tipo,
        descricao: t.descricao,
        data: t.data,
    }).collect();

    Json(PaginatedTransacoes {
        total: total as usize,
        page,
        page_size,
        items,
    })
}

