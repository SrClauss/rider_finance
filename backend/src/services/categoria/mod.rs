use axum::{Json, extract::Path};
use diesel::prelude::*;
use serde::{Serialize, Deserialize};
use crate::db;
use crate::schema::categorias::dsl::*;
use crate::models::{Categoria, NewCategoria};
use chrono::NaiveDateTime;

#[derive(Deserialize)]
pub struct CreateCategoriaPayload {
    pub id_usuario: Option<String>,
    pub nome: String,
    pub tipo: String,
    pub icone: Option<String>,
    pub cor: Option<String>,
    pub eh_padrao: bool,
    pub eh_ativa: bool,
}

#[derive(Serialize)]
pub struct CategoriaResponse {
    pub id: String,
    pub id_usuario: Option<String>,
    pub nome: String,
    pub tipo: String,
    pub icone: Option<String>,
    pub cor: Option<String>,
    pub eh_padrao: bool,
    pub eh_ativa: bool,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}

pub async fn create_categoria_handler(Json(payload): Json<CreateCategoriaPayload>) -> Json<CategoriaResponse> {
    let conn = &mut db::establish_connection();
    let now = chrono::Utc::now().naive_utc();
    let nova_categoria = NewCategoria {
        id: ulid::Ulid::new().to_string(),
        id_usuario: payload.id_usuario,
        nome: payload.nome,
        tipo: payload.tipo,
        icone: payload.icone,
        cor: payload.cor,
        eh_padrao: payload.eh_padrao,
        eh_ativa: payload.eh_ativa,
        criado_em: now,
        atualizado_em: now,
    };
    diesel::insert_into(categorias)
        .values(&nova_categoria)
        .execute(conn)
        .expect("Erro ao inserir categoria");
    Json(CategoriaResponse {
        id: nova_categoria.id,
        id_usuario: nova_categoria.id_usuario,
        nome: nova_categoria.nome,
        tipo: nova_categoria.tipo,
        icone: nova_categoria.icone,
        cor: nova_categoria.cor,
        eh_padrao: nova_categoria.eh_padrao,
        eh_ativa: nova_categoria.eh_ativa,
        criado_em: nova_categoria.criado_em,
        atualizado_em: nova_categoria.atualizado_em,
    })
}

pub async fn list_categorias_handler(Path(id_usuario_param): Path<String>) -> Json<Vec<CategoriaResponse>> {
    let conn = &mut db::establish_connection();
    let results = categorias
        .filter(id_usuario.eq(id_usuario_param.clone()).or(eh_padrao.eq(true)))
        .order(nome.asc())
        .load::<Categoria>(conn)
        .unwrap_or_default();
    Json(results.into_iter().map(|c| CategoriaResponse {
        id: c.id,
        id_usuario: c.id_usuario,
        nome: c.nome,
        tipo: c.tipo,
        icone: c.icone,
        cor: c.cor,
        eh_padrao: c.eh_padrao,
        eh_ativa: c.eh_ativa,
        criado_em: c.criado_em,
        atualizado_em: c.atualizado_em,
    }).collect())
}

pub async fn get_categoria_handler(Path(id_param): Path<String>) -> Json<Option<CategoriaResponse>> {
    let conn = &mut db::establish_connection();
    match categorias.filter(id.eq(id_param)).first::<Categoria>(conn) {
        Ok(c) => Json(Some(CategoriaResponse {
            id: c.id,
            id_usuario: c.id_usuario,
            nome: c.nome,
            tipo: c.tipo,
            icone: c.icone,
            cor: c.cor,
            eh_padrao: c.eh_padrao,
            eh_ativa: c.eh_ativa,
            criado_em: c.criado_em,
            atualizado_em: c.atualizado_em,
        })),
        Err(_) => Json(None),
    }
}

pub async fn delete_categoria_handler(Path(id_param): Path<String>) -> Json<bool> {
    let conn = &mut db::establish_connection();
    let count = diesel::delete(categorias.filter(id.eq(id_param))).execute(conn).unwrap_or(0);
    Json(count > 0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::Json;
    use ulid::Ulid;

    #[tokio::test]
    async fn test_create_get_list_delete_categoria() {
        let conn = &mut db::establish_connection_test();
        diesel::sql_query("PRAGMA foreign_keys = OFF;").execute(conn).ok();
        diesel::sql_query("DELETE FROM categorias;").execute(conn).ok();
        diesel::sql_query("DELETE FROM usuarios;").execute(conn).ok();
        diesel::sql_query("PRAGMA foreign_keys = ON;").execute(conn).ok();

        let user_id = Ulid::new().to_string();
        let usuario = crate::models::NewUsuario::new(
            Some(user_id.clone()),
            format!("testuser_{}", user_id),
            format!("{}@test.com", user_id),
            "senha123".to_string(),
            None, None, None, None, false, None, None, Some("ativo".to_string()), Some("free".to_string()), None, None, None,
            "Rua Teste".to_string(), // address
            "123".to_string(), // address_number
            "Apto 1".to_string(), // complement
            "29936-808".to_string(), // postal_code
            "ES".to_string(), // province
            "São Mateus".to_string(), // city
        );
        crate::services::auth::register::register_user_test(usuario).expect("Erro ao criar usuário de teste");

        let payload = CreateCategoriaPayload {
            id_usuario: Some(user_id.clone()),
            nome: "Alimentação".to_string(),
            tipo: "despesa".to_string(),
            icone: Some("food".to_string()),
            cor: Some("#FF0000".to_string()),
            eh_padrao: false,
            eh_ativa: true,
        };
        let response = create_categoria_handler(Json(payload)).await;
        assert_eq!(response.nome, "Alimentação");
        assert_eq!(response.tipo, "despesa");
        assert_eq!(response.id_usuario, Some(user_id.clone()));

        let get_resp = get_categoria_handler(Path(response.id.clone())).await;
        assert!(get_resp.0.is_some());
        let c = get_resp.0.unwrap();
        assert_eq!(c.nome, "Alimentação");
        assert_eq!(c.tipo, "despesa");

        let list_resp = list_categorias_handler(Path(user_id.clone())).await;
        assert!(list_resp.0.iter().any(|cc| cc.id == c.id));

        let del_resp = delete_categoria_handler(Path(c.id.clone())).await;
        assert!(del_resp.0);
        let get_resp2 = get_categoria_handler(Path(c.id.clone())).await;
        assert!(get_resp2.0.is_none());
    }
}
