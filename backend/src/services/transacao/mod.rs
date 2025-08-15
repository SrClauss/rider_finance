#[cfg(test)]
mod tests {
    fn limpa_banco(conn: &mut diesel::PgConnection) {
        use diesel::prelude::*;
        diesel::sql_query("DELETE FROM transacoes").execute(conn).ok();
        diesel::sql_query("DELETE FROM categorias").execute(conn).ok();
        diesel::sql_query("DELETE FROM usuarios").execute(conn).ok();
    }
    use super::*;
    use axum::extract::Path;
    use axum::Json;

    use tokio;

    #[tokio::test]
    async fn test_create_and_get_transacao() {
        use chrono::Utc;
        limpa_banco(&mut crate::db::establish_connection());
        // Gera IDs únicos
        let user_id = ulid::Ulid::new().to_string();
        let cat_id = ulid::Ulid::new().to_string();
        // Cria usuário via handler (simulado)
        let now = Utc::now().naive_utc();
        let new_user = crate::models::NewUsuario {
            id: user_id.clone(),
            nome_usuario: "user_test".to_string(),
            email: "teste@teste.com".to_string(),
            senha: "senha123".to_string(),
            nome_completo: "Teste".to_string(),
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
        // Usa o mesmo caminho do handler para inserir usuário
        {
            use crate::schema::usuarios::dsl::*;
            let conn = &mut crate::db::establish_connection();
            diesel::insert_into(usuarios)
                .values(&new_user)
                .execute(conn)
                .expect("Erro ao inserir usuário");
        }
        // Cria categoria via handler (simulado)
        let new_cat = crate::models::NewCategoria {
            id: cat_id.clone(),
            id_usuario: Some(user_id.clone()),
            nome: "Categoria Teste".to_string(),
            tipo: "entrada".to_string(),
            icone: None,
            cor: None,
            eh_padrao: false,
            eh_ativa: true,
            criado_em: now,
            atualizado_em: now,
        };
        {
            use crate::schema::categorias::dsl::*;
            let conn = &mut crate::db::establish_connection();
            diesel::insert_into(categorias)
                .values(&new_cat)
                .execute(conn)
                .expect("Erro ao inserir categoria");
        }
        // Cria uma transação única
        let payload = CreateTransacaoPayload {
            id_usuario: user_id.clone(),
            id_categoria: cat_id.clone(),
            valor: 123,
            tipo: "entrada".to_string(),
            descricao: Some("Teste transação".to_string()),
            data: Some(chrono::NaiveDate::from_ymd_opt(2025, 8, 13).unwrap().and_hms_opt(12, 0, 0).unwrap()),
        };
        let Json(resp) = create_transacao_handler(Json(payload)).await;
        assert_eq!(resp.id_usuario, user_id);
        assert_eq!(resp.valor, 123);
        assert_eq!(resp.tipo, "entrada");
        assert_eq!(resp.descricao, Some("Teste transação".to_string()));

        // Busca por ID
        let Json(opt) = get_transacao_handler(Path(resp.id.clone())).await;
        let t = opt.expect("Transação não encontrada");
        assert_eq!(t.id, resp.id);
        assert_eq!(t.valor, 123);

        // Lista por usuário
        let Json(lista) = list_transacoes_handler(Path(user_id.clone())).await;
        if !lista.iter().any(|tr| tr.id == resp.id) {
            panic!("Transação criada não encontrada na lista. Lista: {:?}", lista);
        }
    }
}
#[derive(Deserialize)]
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

use axum::{Json, extract::Path};
use serde::{Serialize, Deserialize};
use diesel::prelude::*;
use crate::db;
use crate::schema::transacoes::dsl::*;
use crate::models::Transacao;

#[derive(Deserialize)]
pub struct CreateTransacaoPayload {
    pub id_usuario: String,
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

pub async fn create_transacao_handler(Json(payload): Json<CreateTransacaoPayload>) -> Json<TransacaoResponse> {
    let conn = &mut db::establish_connection();
    let now = chrono::Utc::now().naive_utc();
    let nova_data = payload.data.unwrap_or(now);
    let nova_transacao = crate::models::NewTransacao {
        id: ulid::Ulid::new().to_string(),
        id_usuario: payload.id_usuario,
        id_categoria: payload.id_categoria,
        valor: payload.valor,
        tipo: payload.tipo,
        descricao: payload.descricao,
        data: nova_data,
        origem: None,
        id_externo: None,
        plataforma: None,
        observacoes: None,
        tags: None,
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

pub async fn list_transacoes_handler(Path(id_usuario_param): Path<String>) -> Json<Vec<TransacaoResponse>> {
    let conn = &mut db::establish_connection();
    let results = transacoes
        .filter(id_usuario.eq(id_usuario_param))
        .order(data.desc())
        .load::<Transacao>(conn)
        .unwrap_or_default();
    Json(results.into_iter().map(|t| TransacaoResponse {
        id: t.id,
        id_usuario: t.id_usuario,
        id_categoria: t.id_categoria,
        valor: t.valor,
        tipo: t.tipo,
        descricao: t.descricao,
        data: t.data,
    }).collect())
}
