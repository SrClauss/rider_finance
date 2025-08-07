pub async fn list_metas_a_cumprir_handler(Path(id_usuario_param): Path<String>) -> Json<Vec<MetaResponse>> {
    let conn = &mut db::establish_connection();
    let results = metas
        .filter(id_usuario.eq(id_usuario_param))
        .filter(eh_concluida.eq(false))
        .order(data_inicio.desc())
        .load::<Meta>(conn)
        .unwrap_or_default();
    Json(results.into_iter().map(|m| MetaResponse {
        id: m.id,
        id_usuario: m.id_usuario,
        titulo: m.titulo,
        descricao: m.descricao,
        tipo: m.tipo,
        categoria: m.categoria,
        valor_alvo: m.valor_alvo,
        valor_atual: m.valor_atual,
        unidade: m.unidade,
        data_inicio: m.data_inicio,
        data_fim: m.data_fim,
        eh_ativa: m.eh_ativa,
        eh_concluida: m.eh_concluida,
        concluida_em: m.concluida_em,
        lembrete_ativo: m.lembrete_ativo,
        frequencia_lembrete: m.frequencia_lembrete,
        criado_em: m.criado_em,
        atualizado_em: m.atualizado_em,
    }).collect())
}

pub async fn list_metas_cumpridas_handler(Path(id_usuario_param): Path<String>) -> Json<Vec<MetaResponse>> {
    let conn = &mut db::establish_connection();
    let results = metas
        .filter(id_usuario.eq(id_usuario_param))
        .filter(eh_concluida.eq(true))
        .order(data_inicio.desc())
        .load::<Meta>(conn)
        .unwrap_or_default();
    Json(results.into_iter().map(|m| MetaResponse {
        id: m.id,
        id_usuario: m.id_usuario,
        titulo: m.titulo,
        descricao: m.descricao,
        tipo: m.tipo,
        categoria: m.categoria,
        valor_alvo: m.valor_alvo,
        valor_atual: m.valor_atual,
        unidade: m.unidade,
        data_inicio: m.data_inicio,
        data_fim: m.data_fim,
        eh_ativa: m.eh_ativa,
        eh_concluida: m.eh_concluida,
        concluida_em: m.concluida_em,
        lembrete_ativo: m.lembrete_ativo,
        frequencia_lembrete: m.frequencia_lembrete,
        criado_em: m.criado_em,
        atualizado_em: m.atualizado_em,
    }).collect())
}
use axum::{Json, extract::Path};
use serde::{Serialize, Deserialize};
use diesel::prelude::*;
use crate::db;
use crate::schema::metas::dsl::*;
use crate::models::{Meta, NewMeta};
use chrono::NaiveDateTime;

#[derive(Deserialize)]
pub struct CreateMetaPayload {
    pub id_usuario: String,
    pub titulo: String,
    pub descricao: Option<String>,
    pub tipo: String,
    pub categoria: String,
    pub valor_alvo: i32,
    pub valor_atual: i32,
    pub unidade: Option<String>,
    pub data_inicio: NaiveDateTime,
    pub data_fim: Option<NaiveDateTime>,
    pub eh_ativa: bool,
    pub eh_concluida: bool,
    pub concluida_em: Option<NaiveDateTime>,
    pub lembrete_ativo: bool,
    pub frequencia_lembrete: Option<String>,
}

#[derive(Serialize)]
pub struct MetaResponse {
    pub id: String,
    pub id_usuario: String,
    pub titulo: String,
    pub descricao: Option<String>,
    pub tipo: String,
    pub categoria: String,
    pub valor_alvo: i32,
    pub valor_atual: i32,
    pub unidade: Option<String>,
    pub data_inicio: NaiveDateTime,
    pub data_fim: Option<NaiveDateTime>,
    pub eh_ativa: bool,
    pub eh_concluida: bool,
    pub concluida_em: Option<NaiveDateTime>,
    pub lembrete_ativo: bool,
    pub frequencia_lembrete: Option<String>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}

pub async fn create_meta_handler(Json(payload): Json<CreateMetaPayload>) -> Json<MetaResponse> {
    let conn = &mut db::establish_connection();
    let now = chrono::Utc::now().naive_utc();
    let nova_meta = NewMeta {
        id: ulid::Ulid::new().to_string(),
        id_usuario: payload.id_usuario,
        titulo: payload.titulo,
        descricao: payload.descricao,
        tipo: payload.tipo,
        categoria: payload.categoria,
        valor_alvo: payload.valor_alvo,
        valor_atual: payload.valor_atual,
        unidade: payload.unidade,
        data_inicio: payload.data_inicio,
        data_fim: payload.data_fim,
        eh_ativa: payload.eh_ativa,
        eh_concluida: payload.eh_concluida,
        concluida_em: payload.concluida_em,
        lembrete_ativo: payload.lembrete_ativo,
        frequencia_lembrete: payload.frequencia_lembrete,
        criado_em: now,
        atualizado_em: now,
    };
    diesel::insert_into(metas)
        .values(&nova_meta)
        .execute(conn)
        .expect("Erro ao inserir meta");
    Json(MetaResponse {
        id: nova_meta.id,
        id_usuario: nova_meta.id_usuario,
        titulo: nova_meta.titulo,
        descricao: nova_meta.descricao,
        tipo: nova_meta.tipo,
        categoria: nova_meta.categoria,
        valor_alvo: nova_meta.valor_alvo,
        valor_atual: nova_meta.valor_atual,
        unidade: nova_meta.unidade,
        data_inicio: nova_meta.data_inicio,
        data_fim: nova_meta.data_fim,
        eh_ativa: nova_meta.eh_ativa,
        eh_concluida: nova_meta.eh_concluida,
        concluida_em: nova_meta.concluida_em,
        lembrete_ativo: nova_meta.lembrete_ativo,
        frequencia_lembrete: nova_meta.frequencia_lembrete,
        criado_em: nova_meta.criado_em,
        atualizado_em: nova_meta.atualizado_em,
    })
}

pub async fn get_meta_handler(Path(id_param): Path<String>) -> Json<Option<MetaResponse>> {
    let conn = &mut db::establish_connection();
    match metas.filter(id.eq(id_param)).first::<Meta>(conn) {
        Ok(m) => Json(Some(MetaResponse {
            id: m.id,
            id_usuario: m.id_usuario,
            titulo: m.titulo,
            descricao: m.descricao,
            tipo: m.tipo,
            categoria: m.categoria,
            valor_alvo: m.valor_alvo,
            valor_atual: m.valor_atual,
            unidade: m.unidade,
            data_inicio: m.data_inicio,
            data_fim: m.data_fim,
            eh_ativa: m.eh_ativa,
            eh_concluida: m.eh_concluida,
            concluida_em: m.concluida_em,
            lembrete_ativo: m.lembrete_ativo,
            frequencia_lembrete: m.frequencia_lembrete,
            criado_em: m.criado_em,
            atualizado_em: m.atualizado_em,
        })),
        Err(_) => Json(None),
    }
}

pub async fn list_metas_handler(Path(id_usuario_param): Path<String>) -> Json<Vec<MetaResponse>> {
    let conn = &mut db::establish_connection();
    let results = metas
        .filter(id_usuario.eq(id_usuario_param))
        .order(data_inicio.desc())
        .load::<Meta>(conn)
        .unwrap_or_default();
    Json(results.into_iter().map(|m| MetaResponse {
        id: m.id,
        id_usuario: m.id_usuario,
        titulo: m.titulo,
        descricao: m.descricao,
        tipo: m.tipo,
        categoria: m.categoria,
        valor_alvo: m.valor_alvo,
        valor_atual: m.valor_atual,
        unidade: m.unidade,
        data_inicio: m.data_inicio,
        data_fim: m.data_fim,
        eh_ativa: m.eh_ativa,
        eh_concluida: m.eh_concluida,
        concluida_em: m.concluida_em,
        lembrete_ativo: m.lembrete_ativo,
        frequencia_lembrete: m.frequencia_lembrete,
        criado_em: m.criado_em,
        atualizado_em: m.atualizado_em,
    }).collect())
}

#[derive(Deserialize)]
pub struct UpdateMetaPayload {
    pub titulo: Option<String>,
    pub descricao: Option<String>,
    pub tipo: Option<String>,
    pub categoria: Option<String>,
    pub valor_alvo: Option<i32>,
    pub valor_atual: Option<i32>,
    pub unidade: Option<String>,
    pub data_inicio: Option<NaiveDateTime>,
    pub data_fim: Option<NaiveDateTime>,
    pub eh_ativa: Option<bool>,
    pub eh_concluida: Option<bool>,
    pub concluida_em: Option<NaiveDateTime>,
    pub lembrete_ativo: Option<bool>,
    pub frequencia_lembrete: Option<String>,
}

#[derive(AsChangeset, Default)]
#[diesel(table_name = crate::schema::metas)]
pub struct MetaChangeset {
    pub titulo: Option<String>,
    pub descricao: Option<String>,
    pub tipo: Option<String>,
    pub categoria: Option<String>,
    pub valor_alvo: Option<i32>,
    pub valor_atual: Option<i32>,
    pub unidade: Option<String>,
    pub data_inicio: Option<NaiveDateTime>,
    pub data_fim: Option<NaiveDateTime>,
    pub eh_ativa: Option<bool>,
    pub eh_concluida: Option<bool>,
    pub concluida_em: Option<NaiveDateTime>,
    pub lembrete_ativo: Option<bool>,
    pub frequencia_lembrete: Option<String>,
}

pub async fn update_meta_handler(Path(id_param): Path<String>, Json(payload): Json<UpdateMetaPayload>) -> Json<Option<MetaResponse>> {
    let conn = &mut db::establish_connection();
    let changeset = MetaChangeset {
        titulo: payload.titulo,
        descricao: payload.descricao,
        tipo: payload.tipo,
        categoria: payload.categoria,
        valor_alvo: payload.valor_alvo,
        valor_atual: payload.valor_atual,
        unidade: payload.unidade,
        data_inicio: payload.data_inicio,
        data_fim: payload.data_fim,
        eh_ativa: payload.eh_ativa,
        eh_concluida: payload.eh_concluida,
        concluida_em: payload.concluida_em,
        lembrete_ativo: payload.lembrete_ativo,
        frequencia_lembrete: payload.frequencia_lembrete,
    };
    diesel::update(metas.filter(id.eq(&id_param)))
        .set(changeset)
        .execute(conn)
        .ok();
    match metas.filter(id.eq(id_param)).first::<Meta>(conn) {
        Ok(m) => Json(Some(MetaResponse {
            id: m.id,
            id_usuario: m.id_usuario,
            titulo: m.titulo,
            descricao: m.descricao,
            tipo: m.tipo,
            categoria: m.categoria,
            valor_alvo: m.valor_alvo,
            valor_atual: m.valor_atual,
            unidade: m.unidade,
            data_inicio: m.data_inicio,
            data_fim: m.data_fim,
            eh_ativa: m.eh_ativa,
            eh_concluida: m.eh_concluida,
            concluida_em: m.concluida_em,
            lembrete_ativo: m.lembrete_ativo,
            frequencia_lembrete: m.frequencia_lembrete,
            criado_em: m.criado_em,
            atualizado_em: m.atualizado_em,
        })),
        Err(_) => Json(None),
    }
}

pub async fn delete_meta_handler(Path(id_param): Path<String>) -> Json<bool> {
    let conn = &mut db::establish_connection();
    let count = diesel::delete(metas.filter(id.eq(id_param))).execute(conn).unwrap_or(0);
    Json(count > 0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::Json;
    use chrono::Utc;
    use ulid::Ulid;

    #[tokio::test]
    async fn test_create_get_list_update_delete_meta() {
        // Usa banco de dados de testes e faz limpeza total
        let conn = &mut db::establish_connection_test();
        diesel::sql_query("PRAGMA foreign_keys = OFF;").execute(conn).ok();
        diesel::sql_query("DELETE FROM metas;").execute(conn).ok();
        diesel::sql_query("DELETE FROM transacoes;").execute(conn).ok();
        diesel::sql_query("DELETE FROM usuarios;").execute(conn).ok();
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

        // Cria meta
        let payload = CreateMetaPayload {
            id_usuario: user_id.clone(),
            titulo: "Meta Teste".to_string(),
            descricao: Some("Descrição".to_string()),
            tipo: "financeira".to_string(),
            categoria: "ganhos".to_string(),
            valor_alvo: 1000,
            valor_atual: 100,
            unidade: Some("R$".to_string()),
            data_inicio: Utc::now().naive_utc(),
            data_fim: None,
            eh_ativa: true,
            eh_concluida: false,
            concluida_em: None,
            lembrete_ativo: false,
            frequencia_lembrete: None,
        };
        let response = create_meta_handler(Json(payload)).await;
        assert_eq!(response.id_usuario, user_id);
        assert_eq!(response.valor_alvo, 1000);
        // Busca por id
        let get_resp = get_meta_handler(Path(response.id.clone())).await;
        assert!(get_resp.0.is_some());
        let m = get_resp.0.unwrap();
        assert_eq!(m.id, response.id);
        assert_eq!(m.valor_alvo, 1000);
        // Lista
        let list_resp = list_metas_handler(Path(user_id.clone())).await;
        assert!(list_resp.0.iter().any(|mm| mm.id == m.id));
        // Update
        let update_payload = UpdateMetaPayload {
            titulo: Some("Meta Alterada".to_string()),
            descricao: None,
            tipo: None,
            categoria: None,
            valor_alvo: Some(2000),
            valor_atual: None,
            unidade: None,
            data_inicio: None,
            data_fim: None,
            eh_ativa: None,
            eh_concluida: None,
            concluida_em: None,
            lembrete_ativo: None,
            frequencia_lembrete: None,
        };
        let update_resp = update_meta_handler(Path(m.id.clone()), Json(update_payload)).await;
        assert!(update_resp.0.is_some());
        let mu = update_resp.0.unwrap();
        assert_eq!(mu.titulo, "Meta Alterada");
        assert_eq!(mu.valor_alvo, 2000);
        // Delete
        let del_resp = delete_meta_handler(Path(m.id.clone())).await;
        assert!(del_resp.0);
        // Busca após delete
        let get_resp2 = get_meta_handler(Path(m.id.clone())).await;
        assert!(get_resp2.0.is_none());
    }

    #[tokio::test]
    async fn test_get_inexistente() {
        let get_resp = get_meta_handler(Path("naoexiste".to_string())).await;
        assert!(get_resp.0.is_none());
    }
}
