#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::establish_connection;
    use diesel::prelude::*;
    use serial_test::serial;
    use chrono::{NaiveDate};

    fn clean_db() {
        std::env::set_var("ENVIRONMENT", "tests");
        let conn = &mut establish_connection();
        diesel::delete(crate::schema::metas::dsl::metas).execute(conn).ok();
        diesel::delete(crate::schema::usuarios::dsl::usuarios).execute(conn).ok();
    }

    fn create_fake_user() -> String {
        use crate::models::usuario::NewUsuario;
        use crate::schema::usuarios::dsl::*;
        let conn = &mut establish_connection();
        let now = chrono::Utc::now().naive_utc();
        let usuario_id = "user_meta_test".to_string();
        let new_user = NewUsuario {
            id: usuario_id.clone(),
            nome_usuario: "user_meta_test".to_string(),
            email: "meta@teste.com".to_string(),
            senha: "senha123".to_string(),
            nome_completo: "Meta Teste".to_string(),
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
        diesel::insert_into(usuarios)
            .values(&new_user)
            .execute(conn)
            .expect("Erro ao inserir usuário");
        usuario_id
    }

    fn fake_payload() -> CreateMetaPayload {
        CreateMetaPayload {
            id_usuario: "user_meta_test".to_string(),
            titulo: "Meta Teste".to_string(),
            descricao: Some("Descrição de teste".to_string()),
            tipo: "financeira".to_string(),
            categoria: "poupança".to_string(),
            valor_alvo: 1000,
            valor_atual: 100,
            unidade: Some("R$".to_string()),
            data_inicio: NaiveDate::from_ymd_opt(2025, 8, 14).unwrap().and_hms_opt(0,0,0).unwrap(),
            data_fim: None,
            eh_ativa: true,
            eh_concluida: false,
            concluida_em: None,
            lembrete_ativo: false,
            frequencia_lembrete: None,
        }
    }

    #[tokio::test]
    #[serial]
    async fn test_create_and_list_meta() {
        clean_db();
        create_fake_user();
        // Cria meta
        let payload = fake_payload();
        let resp = create_meta_handler(axum::Json(payload)).await;
        assert_eq!(resp.titulo, "Meta Teste");
        // Lista metas
        let list = list_metas_handler(axum::extract::Path("user_meta_test".to_string())).await;
        assert_eq!(list.0.len(), 1);
        assert_eq!(list.0[0].titulo, "Meta Teste");
    }

    #[tokio::test]
    #[serial]
    async fn test_get_and_delete_meta() {
        clean_db();
        create_fake_user();
        // Cria meta
        let payload = fake_payload();
        let resp = create_meta_handler(axum::Json(payload)).await;
        let meta_id = resp.id.clone();
        // Busca meta
        let found = get_meta_handler(axum::extract::Path(meta_id.clone())).await;
        assert!(found.0.is_some());
        // Deleta meta
        let del = delete_meta_handler(axum::extract::Path(meta_id.clone())).await;
        assert!(del.0);
        // Busca novamente
        let found2 = get_meta_handler(axum::extract::Path(meta_id)).await;
        assert!(found2.0.is_none());
    }
}

pub async fn list_metas_a_cumprir_handler(jar: CookieJar) -> Json<Vec<MetaResponse>> {
    let conn = &mut db::establish_connection();
    let user_id = extract_user_id_from_cookie(&jar).expect("Usuário não autenticado");
    let results = metas
        .filter(id_usuario.eq(user_id))
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
use axum_extra::extract::cookie::CookieJar;
use crate::services::auth::login::extract_user_id_from_cookie;
use serde::{Serialize, Deserialize};
use diesel::prelude::*;
use crate::db;
use crate::schema::metas::dsl::*;
use crate::models::{Meta, NewMeta};
use chrono::NaiveDateTime;

#[derive(Deserialize)]
pub struct CreateMetaPayload {
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

pub async fn create_meta_handler(jar: CookieJar, Json(payload): Json<CreateMetaPayload>) -> Json<MetaResponse> {
    let conn = &mut db::establish_connection();
    let now = chrono::Utc::now().naive_utc();
    let user_id = extract_user_id_from_cookie(&jar).expect("Usuário não autenticado");
    let nova_meta = NewMeta {
        id: ulid::Ulid::new().to_string(),
        id_usuario: user_id,
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

