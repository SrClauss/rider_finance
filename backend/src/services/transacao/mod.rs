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
#[cfg(test)]
mod tests {
    use super::*;
    use axum::Json;
    use crate::db;
    use ulid::Ulid;

    #[tokio::test]
    async fn test_create_get_list_update_delete_transacao() {
        // Usa banco de dados de testes e faz limpeza total
        let conn = &mut db::establish_connection_test();
        diesel::sql_query("PRAGMA foreign_keys = OFF;").execute(conn).ok();
        diesel::sql_query("DELETE FROM transacoes;").execute(conn).ok();
        diesel::sql_query("DELETE FROM usuarios;").execute(conn).ok();
        diesel::sql_query("DELETE FROM categorias;").execute(conn).ok();
        diesel::sql_query("PRAGMA foreign_keys = ON;").execute(conn).ok();

        // Cria usuário de teste único
        let user_id = Ulid::new().to_string();
        let usuario = crate::models::NewUsuario::new(
            Some(user_id.clone()),
            format!("testuser_{}", user_id),
            format!("{}@test.com", user_id),
            "senha123".to_string(),
            None, None, None, None, false, None, None, Some("ativo".to_string()), Some("free".to_string()), None, None, None
        );
        crate::services::auth::register::register_user_test(usuario).expect("Erro ao criar usuário de teste");

        // Cria categoria de teste única
        let cat_id = Ulid::new().to_string();
        diesel::sql_query(format!(
            "INSERT INTO categorias (id, nome, tipo, eh_padrao, eh_ativa, criado_em, atualizado_em) VALUES ('{}', '{}', 'entrada', false, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)",
            cat_id, format!("cat_{}", cat_id)
        )).execute(conn).expect("Erro ao criar categoria de teste");

        // Cria transação
        let payload = CreateTransacaoPayload {
            id_usuario: user_id.clone(),
            id_categoria: cat_id.clone(),
            valor: 123,
            tipo: "entrada".to_string(),
            descricao: Some("Teste".to_string()),
            data: None,
        };
        let response = create_transacao_handler(Json(payload)).await;
        assert_eq!(response.id_usuario, user_id);
        assert_eq!(response.valor, 123);
        // Busca por id
        let get_resp = get_transacao_handler(Path(response.id.clone())).await;
        assert!(get_resp.0.is_some());
        let t = get_resp.0.unwrap();
        assert_eq!(t.id, response.id);
        assert_eq!(t.valor, 123);
        // Lista
        let list_resp = list_transacoes_handler(Path(user_id.clone())).await;
        assert!(list_resp.0.iter().any(|tt| tt.id == t.id));
        // Update
        let update_payload = UpdateTransacaoPayload {
            valor: Some(999),
            tipo: None,
            descricao: Some("Alterado".to_string()),
            data: None,
        };
        let update_resp = update_transacao_handler(Path(t.id.clone()), Json(update_payload)).await;
        assert!(update_resp.0.is_some());
        let tu = update_resp.0.unwrap();
        assert_eq!(tu.valor, 999);
        assert_eq!(tu.descricao, Some("Alterado".to_string()));
        // Delete
        let del_resp = delete_transacao_handler(Path(t.id.clone())).await;
        assert!(del_resp.0);
        // Busca após delete
        let get_resp2 = get_transacao_handler(Path(t.id.clone())).await;
        assert!(get_resp2.0.is_none());
    }

    #[tokio::test]
    async fn test_get_inexistente() {
        let get_resp = get_transacao_handler(Path("naoexiste".to_string())).await;
        assert!(get_resp.0.is_none());
    }
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
