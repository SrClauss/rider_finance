use axum::{ response::{ Response }, http::{ StatusCode, header } };
use crate::utils::relatorio::{ gerar_pdf, gerar_xlsx };
use crate::cache::RIDER_CACHE;

#[derive(Deserialize)]
pub struct RelatorioTransacoesRequest {
    pub tipo_arquivo: String, // "pdf" ou "xlsx"
    pub filtros: TransacaoFiltro,
}

#[axum::debug_handler]
pub async fn relatorio_transacoes_handler(
    jar: CookieJar,
    Json(req): Json<RelatorioTransacoesRequest>
) -> Response {
    use crate::schema::transacoes::dsl::*;
    let conn = &mut db::establish_connection();
    let token = jar
        .get("auth_token")
        .map(|c| c.value().to_string())
        .unwrap_or_default();
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let claims = decode::<Claims>(
        token.as_str(),
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::default()
    )
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
            query = query.filter(descricao.ilike(format!("%{desc}%")));
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
        }
        "xlsx" => {
            let xlsx_bytes = gerar_xlsx(&results, &user_id, conn);
            Response::builder()
                .status(StatusCode::OK)
                .header(
                    header::CONTENT_TYPE,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                )
                .header(header::CONTENT_DISPOSITION, "attachment; filename=relatorio.xlsx")
                .body(xlsx_bytes.into())
                .unwrap()
        }
        _ =>
            Response::builder()
                .status(StatusCode::BAD_REQUEST)
                .body("Tipo de arquivo inválido".into())
                .unwrap(),
    }
}
use chrono::{ Utc };

use axum::{ Json, extract::Path };
use axum_extra::extract::cookie::CookieJar;
use serde::{ Serialize, Deserialize };
use diesel::prelude::*;
use diesel::AsChangeset;
use crate::db;
use crate::schema::transacoes::dsl::*;
use crate::models::Transacao;
use jsonwebtoken::{ decode, DecodingKey, Validation };

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub exp: usize,
}

#[derive(Serialize, Deserialize)]
pub struct UpdateTransacaoPayload {
    pub valor: Option<i32>,
    pub tipo: Option<String>,
    pub descricao: Option<String>,
    pub data: Option<chrono::DateTime<chrono::Utc>>, // Aceitar diretamente DateTime<Utc>
    pub eventos: Option<i32>,
}

use crate::schema::transacoes;

#[derive(AsChangeset, Default)]
#[diesel(table_name = transacoes)]
pub struct TransacaoChangeset {
    pub valor: Option<i32>,
    pub tipo: Option<String>,
    pub descricao: Option<String>,
    pub data: Option<chrono::DateTime<chrono::Utc>>, // Mantém como DateTime<Utc> para o Diesel
    pub eventos: Option<i32>,
}

pub async fn update_transacao_handler(
    Path(id_param): Path<String>,
    Json(payload): Json<UpdateTransacaoPayload>
) -> Json<Option<TransacaoResponse>> {
    let conn = &mut db::establish_connection();

    // Buscar transação original para obter user_id
    let original_transaction = transacoes.filter(id.eq(&id_param)).first::<Transacao>(conn);

    // Certificar que a data está em UTC antes de salvar
    let data_utc = payload.data.map(|d| d.with_timezone(&Utc));
    println!("Atualizando transação com data em UTC: {:?}", data_utc);

    let changeset = TransacaoChangeset {
        valor: payload.valor,
        tipo: payload.tipo,
        descricao: payload.descricao,
        data: data_utc, // Gravar diretamente como DateTime<Utc>
        eventos: payload.eventos,
    };

    diesel
        ::update(transacoes.filter(id.eq(&id_param)))
        .set(changeset)
        .execute(conn)
        .ok();

    // CACHE LAYER: Invalidar ambos os caches após edição
    if let Ok(original) = original_transaction {
        RIDER_CACHE.invalidate_user_caches(&original.id_usuario).await;
    }

    match transacoes.filter(id.eq(id_param)).first::<Transacao>(conn) {
        Ok(t) =>
            Json(
                Some(TransacaoResponse {
                    id: t.id,
                    id_usuario: t.id_usuario,
                    id_categoria: t.id_categoria,
                    valor: t.valor,
                    eventos: t.eventos,
                    tipo: t.tipo,
                    descricao: t.descricao,
                    data: t.data,
                })
            ),
        Err(_) => Json(None),
    }
}

pub async fn delete_transacao_handler(Path(id_param): Path<String>) -> Json<bool> {
    let conn = &mut db::establish_connection();

    // Buscar transação antes de deletar para obter user_id
    let transaction_to_delete = transacoes.filter(id.eq(&id_param)).first::<Transacao>(conn);

    let count = diesel
        ::delete(transacoes.filter(id.eq(id_param)))
        .execute(conn)
        .unwrap_or(0);

    // CACHE LAYER: Invalidar ambos os caches após deleção
    if let Ok(deleted_transaction) = transaction_to_delete {
        RIDER_CACHE.invalidate_user_caches(&deleted_transaction.id_usuario).await;
    }

    Json(count > 0)
}

#[derive(Deserialize)]
pub struct CreateTransacaoPayload {
    pub id_categoria: String,
    pub valor: i32,
    pub tipo: String,
    pub descricao: Option<String>,
    pub data: Option<String>, // Alterado para String para aceitar formato do frontend
    pub eventos: Option<i32>,
}

#[derive(Serialize)]
#[derive(Debug)]
pub struct TransacaoResponse {
    pub id: String,
    pub id_usuario: String,
    pub id_categoria: String,
    pub valor: i32,
    pub eventos: i32,
    pub tipo: String,
    pub descricao: Option<String>,
    pub data: chrono::DateTime<chrono::Utc>,
}

pub async fn create_transacao_handler(
    jar: CookieJar,
    Json(payload): Json<CreateTransacaoPayload>
) -> Json<TransacaoResponse> {
    let conn = &mut db::establish_connection();
    let now: chrono::DateTime<chrono::Utc> = chrono::Utc::now();
    let token = jar
        .get("auth_token")
        .map(|c| c.value().to_string())
        .unwrap_or_default();
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let claims = decode::<Claims>(
        token.as_str(),
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::default()
    )
        .map(|token_data| token_data.claims)
        .unwrap_or_else(|_| Claims { sub: "".to_string(), email: "".to_string(), exp: 0 });
    let user_id = claims.sub.clone();
    let nova_data: chrono::DateTime<chrono::Utc> = match payload.data {
        Some(ref data_str) => {
            println!("Recebendo data do payload: {}", data_str);
            chrono::DateTime::parse_from_rfc3339(data_str)
                .map(|dt| {
                    let utc_date = dt.with_timezone(&chrono::Utc);
                    println!("Convertendo data para UTC: {}", utc_date);
                    utc_date
                })
                .unwrap_or_else(|_| {
                    println!("Erro ao converter data, usando Utc::now()");
                    chrono::Utc::now()
                })
        }
        None => {
            println!("Data não fornecida, usando Utc::now()");
            chrono::Utc::now()
        }
    };

    let nova_transacao = crate::models::NewTransacao {
        id: ulid::Ulid::new().to_string(),
        id_usuario: user_id.clone(),
        id_categoria: payload.id_categoria,
        valor: payload.valor,
        eventos: payload.eventos.unwrap_or(1),
        tipo: payload.tipo,
        descricao: payload.descricao,
        data: nova_data,
        criado_em: now,
        atualizado_em: now,
    };
    
    println!("Criando transação com data UTC: {}", nova_data);
    println!("Timezone da data: {}", nova_data.timezone());
    
    let _result = diesel
        ::insert_into(transacoes)
        .values(&nova_transacao)
        .execute(conn)
        .expect("Erro ao inserir transação");

    // CACHE LAYER: Adicionar ao cache como transação nova
    let transacao_criada = Transacao {
        id: nova_transacao.id.clone(),
        id_usuario: nova_transacao.id_usuario.clone(),
        id_categoria: nova_transacao.id_categoria.clone(),
        valor: nova_transacao.valor,
        eventos: nova_transacao.eventos,
        descricao: nova_transacao.descricao.clone(),
        tipo: nova_transacao.tipo.clone(),
        data: nova_transacao.data,
        criado_em: nova_transacao.criado_em,
        atualizado_em: nova_transacao.atualizado_em,
    };

    crate::cache::transacao::add_new_transaction(&user_id, transacao_criada).await;

    Json(TransacaoResponse {
        id: nova_transacao.id,
        id_usuario: nova_transacao.id_usuario,
        id_categoria: nova_transacao.id_categoria,
        valor: nova_transacao.valor,
        eventos: nova_transacao.eventos,
        tipo: nova_transacao.tipo,
        descricao: nova_transacao.descricao,
        data: nova_transacao.data,
    })
}

pub async fn get_transacao_handler(Path(
    id_param,
): Path<String>) -> Json<Option<TransacaoResponse>> {
    let conn = &mut db::establish_connection();
    match transacoes.filter(id.eq(id_param)).first::<Transacao>(conn) {
        Ok(t) =>
            Json(
                Some(TransacaoResponse {
                    id: t.id,
                    id_usuario: t.id_usuario,
                    id_categoria: t.id_categoria,
                    valor: t.valor,
                    eventos: t.eventos,
                    tipo: t.tipo,
                    descricao: t.descricao,
                    data: t.data,
                })
            ),
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
    pub data_inicio: Option<chrono::DateTime<Utc>>,
    pub data_fim: Option<chrono::DateTime<Utc>>,
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
    Json(filtro): Json<TransacaoFiltro>
) -> Json<PaginatedTransacoes> {
    // (nenhum import extra necessário)
    let conn = &mut db::establish_connection();
    let token = jar
        .get("auth_token")
        .map(|c| c.value().to_string())
        .unwrap_or_default();
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let claims = decode::<Claims>(
        token.as_str(),
        &DecodingKey::from_secret(secret.as_ref()),
        &Validation::default()
    )
        .map(|token_data| token_data.claims)
        .unwrap_or_else(|_| Claims { sub: "".to_string(), email: "".to_string(), exp: 0 });
    let user_id = claims.sub.clone();

    let page = filtro.page.unwrap_or(1).max(1);
    let page_size = filtro.page_size.unwrap_or(10).clamp(1, 100);
    let offset = (page - 1) * page_size;

    // CACHE LAYER: Tentar cache para páginas 1 e 2 sem filtros
    let is_simple_query =
        filtro.id_categoria.is_none() &&
        filtro.descricao.is_none() &&
        filtro.tipo.is_none() &&
        filtro.data_inicio.is_none() &&
        filtro.data_fim.is_none();

    if is_simple_query && page <= 2 {
        if
            let Some(cached_transactions) = crate::cache::transacao::get_cached_transactions(
                &user_id,
                page,
                page_size
            ).await
        {
            // Buscar total do banco se necessário (cache não tem total)
            let count_query = transacoes.filter(id_usuario.eq(&user_id)).into_boxed();
            let total: i64 = count_query.count().get_result(conn).unwrap_or(0);

            let items = cached_transactions
                .into_iter()
                .map(|t| TransacaoResponse {
                    id: t.id,
                    id_usuario: t.id_usuario,
                    id_categoria: t.id_categoria,
                    valor: t.valor,
                    eventos: t.eventos,
                    tipo: t.tipo,
                    descricao: t.descricao,
                    data: t.data,
                })
                .collect();

            return Json(PaginatedTransacoes {
                total: total as usize,
                page,
                page_size,
                items,
            });
        }
    }

    // Cache miss ou consulta com filtros - usar lógica original

    // Monta query base para count
    let mut count_query = transacoes.filter(id_usuario.eq(&user_id)).into_boxed();
    if let Some(ref cat) = filtro.id_categoria {
        count_query = count_query.filter(id_categoria.eq(cat));
    }
    if let Some(ref desc) = filtro.descricao {
        count_query = count_query.filter(descricao.ilike(format!("%{desc}%")));
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
        data_query = data_query.filter(descricao.ilike(format!("%{desc}%")));
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

    let items = results
        .clone()
        .into_iter()
        .map(|t| TransacaoResponse {
            id: t.id,
            id_usuario: t.id_usuario,
            id_categoria: t.id_categoria,
            valor: t.valor,
            eventos: t.eventos,
            tipo: t.tipo,
            descricao: t.descricao,
            data: t.data,
        })
        .collect();

    // Salvar no cache se é primeira página sem filtros
    if is_simple_query && page == 1 {
        crate::cache::transacao::set_cached_transactions(&user_id, results).await;
    }

    Json(PaginatedTransacoes {
        total: total as usize,
        page,
        page_size,
        items,
    })
}
