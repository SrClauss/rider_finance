#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::establish_connection;
    use chrono::Utc;
    use crate::models::usuario::NewUsuario;


    use serde::Serialize;

    fn clean_db() {
        std::env::set_var("ENVIRONMENT", "tests");
        let conn = &mut establish_connection();
        diesel::delete(crate::schema::metas::dsl::metas).execute(conn).ok();
        diesel::delete(crate::schema::usuarios::dsl::usuarios).execute(conn).ok();
    }

    fn create_fake_user(conn: &mut diesel::PgConnection, forced_id: &str) -> String {
        let now = Utc::now().naive_utc();
        let usuario_id = forced_id.to_string();
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
        use crate::schema::usuarios::dsl::*;
        let usuario_existe = usuarios
            .filter(id.eq(&usuario_id))
            .first::<crate::models::usuario::Usuario>(conn)
            .is_ok();
        if !usuario_existe {
            diesel::insert_into(usuarios)
                .values(&new_user)
                .on_conflict(id)
                .do_nothing()
                .execute(conn)
                .expect("Erro ao inserir usuário");
        }
        usuario_id
    }

    fn fake_payload() -> CreateMetaPayload {
        let now = Utc::now().naive_utc();
        CreateMetaPayload {
            titulo: "Meta Teste".to_string(),
            descricao: Some("Descrição de teste".to_string()),
            tipo: "financeira".to_string(),
            categoria: "poupança".to_string(),
            valor_alvo: 1000,
            valor_atual: 100,
            unidade: Some("R$".to_string()),
            data_inicio: Some(now),
            data_fim: None,
            eh_ativa: true,
            eh_concluida: false,
            concluida_em: None,
            concluida_com: None,
        }
    }

    #[derive(Serialize, serde::Deserialize)]
    struct Claims {
        sub: String,
        email: String,
        exp: usize,
    }

    #[tokio::test]
    async fn test_get_and_delete_meta() {
        clean_db();
        let conn = &mut establish_connection();
        let user_id = "user_meta_test".to_string();
        create_fake_user(conn, &user_id);
        // Gera JWT válido para o cookie
        let payload = fake_payload();
        let now = chrono::Utc::now().naive_utc();
        let nova_meta = crate::models::NewMeta {
            id: ulid::Ulid::new().to_string(),
            id_usuario: user_id.clone(),
            titulo: payload.titulo,
            descricao: payload.descricao,
            tipo: payload.tipo,
            categoria: payload.categoria,
            valor_alvo: payload.valor_alvo,
            valor_atual: payload.valor_atual,
            unidade: payload.unidade,
            data_inicio: payload.data_inicio.unwrap_or(now),
            data_fim: payload.data_fim,
            eh_ativa: payload.eh_ativa,
            eh_concluida: payload.eh_concluida,
            concluida_em: payload.concluida_em,
            concluida_com: payload.concluida_com,
            criado_em: now,
            atualizado_em: now,
        };
        use crate::schema::metas::dsl::*;
        diesel::insert_into(metas)
            .values(&nova_meta)
            .execute(conn)
            .expect("Erro ao inserir meta");
        let meta_id = nova_meta.id.clone();
        // Busca meta diretamente usando a mesma conexão
        let found = metas.filter(id.eq(&meta_id)).first::<crate::models::Meta>(conn);
        assert!(found.is_ok(), "Meta não encontrada após inserção");
        // Deleta meta via Diesel
        let deleted = diesel::delete(metas.filter(id.eq(&meta_id)).filter(id_usuario.eq(&user_id)))
            .execute(conn)
            .unwrap_or(0);
        assert!(deleted > 0, "Falha ao deletar meta via Diesel: usuário = {}", user_id);
        // Busca novamente
        let found2 = metas.filter(id.eq(&meta_id)).first::<crate::models::Meta>(conn);
        assert!(found2.is_err(), "Meta ainda encontrada após deleção");
    }
}
#[derive(Deserialize)]
pub struct CreateMetaPayload {
    pub titulo: String,
    pub descricao: Option<String>,
    pub tipo: String,
    pub categoria: String,
    pub valor_alvo: i32,
    pub valor_atual: i32,
    pub unidade: Option<String>,
    pub data_inicio: Option<NaiveDateTime>,
    pub data_fim: Option<NaiveDateTime>,
    pub eh_ativa: bool,
    pub eh_concluida: bool,
    pub concluida_em: Option<NaiveDateTime>,
    pub concluida_com: Option<i32>,
}

mod metas_com_transacoes;
pub use metas_com_transacoes::*;
use axum::{Json, extract::Path};
use diesel::AsChangeset;
use axum_extra::extract::cookie::CookieJar;
use crate::services::auth::login::extract_user_id_from_cookie;
use crate::db;
use crate::schema::metas;
use crate::schema::metas::dsl::*;
use diesel::{QueryDsl, RunQueryDsl, ExpressionMethods};
use crate::models::{Meta, NewMeta};
use chrono::NaiveDateTime;
use serde::Deserialize;

#[derive(Deserialize, Default)]
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
    pub concluida_com: Option<i32>,
}

#[derive(AsChangeset, Default)]
#[diesel(table_name = metas)]
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
    pub criado_em: Option<NaiveDateTime>,
    pub atualizado_em: Option<NaiveDateTime>,
    pub concluida_com: Option<i32>,
}

pub async fn list_metas_a_cumprir_handler(jar: CookieJar) -> Json<Vec<Meta>> {
    let conn = &mut db::establish_connection();
    let user_id = extract_user_id_from_cookie(&jar).expect("Usuário não autenticado");
    let results = metas
        .filter(id_usuario.eq(user_id))
        .filter(eh_ativa.eq(true))
        .order(data_inicio.desc())
        .load::<Meta>(conn)
        .unwrap_or_default();
    Json(results)
}

pub async fn list_metas_cumpridas_handler(Path(id_usuario_param): Path<String>) -> Json<Vec<Meta>> {
    let conn = &mut db::establish_connection();
    let results = metas
        .filter(id_usuario.eq(id_usuario_param))
        .filter(eh_ativa.eq(false))
        .order(data_inicio.desc())
        .load::<Meta>(conn)
        .unwrap_or_default();
    Json(results)
}

pub async fn create_meta_handler(jar: CookieJar, Json(payload): Json<CreateMetaPayload>) -> Json<Meta> {
    let conn = &mut db::establish_connection();
    let now = chrono::Utc::now().naive_utc();
    let user_id = extract_user_id_from_cookie(&jar).expect("Usuário não autenticado");
    let nova_meta = NewMeta {
        id: ulid::Ulid::new().to_string(),
        id_usuario: user_id.clone(),
        titulo: payload.titulo,
        descricao: payload.descricao,
        tipo: payload.tipo,
        categoria: payload.categoria,
        valor_alvo: payload.valor_alvo,
        valor_atual: payload.valor_atual,
        unidade: payload.unidade,
        data_inicio: payload.data_inicio.unwrap_or(now),
        data_fim: payload.data_fim,
        eh_ativa: payload.eh_ativa,
        eh_concluida: payload.eh_concluida,
        concluida_em: payload.concluida_em,
        criado_em: now,
        atualizado_em: now,
        concluida_com: payload.concluida_com,
    };

    diesel::insert_into(metas)
        .values(&nova_meta)
        .execute(conn)
        .expect("Erro ao inserir meta");

    let meta = metas
        .filter(id.eq(&nova_meta.id))
        .first::<Meta>(conn)
        .expect("Meta não encontrada após inserção");
    Json(meta)
}

pub async fn get_meta_handler(Path(id_param): Path<String>) -> Json<Option<Meta>> {
    let conn = &mut db::establish_connection();
    match metas.filter(id.eq(id_param)).first::<Meta>(conn) {
        Ok(m) => Json(Some(m)),
        Err(_) => Json(None),
    }
}

pub async fn list_metas_handler(Path(id_usuario_param): Path<String>) -> Json<Vec<Meta>> {
    let conn = &mut db::establish_connection();
    let results = metas
        .filter(id_usuario.eq(id_usuario_param))
        .order(data_inicio.desc())
        .load::<Meta>(conn)
        .unwrap_or_default();
    Json(results)
}

pub async fn update_meta_handler(Path(id_param): Path<String>, Json(payload): Json<UpdateMetaPayload>) -> Json<Option<Meta>> {
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
        criado_em: None,
        atualizado_em: None,
        concluida_com: payload.concluida_com,
    };
    diesel::update(metas.filter(id.eq(&id_param)))
        .set(changeset)
        .execute(conn)
        .ok();
    match metas.filter(id.eq(id_param)).first::<Meta>(conn) {
        Ok(m) => Json(Some(m)),
        Err(_) => Json(None),
    }
}

pub async fn delete_meta_handler(jar: CookieJar, Path(id_param): Path<String>) -> Json<bool> {
    let conn = &mut db::establish_connection();
    let user_id = extract_user_id_from_cookie(&jar).expect("Usuário não autenticado");
    // Só deleta se a meta for do usuário autenticado
    let count = diesel::delete(metas.filter(id.eq(&id_param)).filter(id_usuario.eq(&user_id)))
        .execute(conn)
        .unwrap_or(0);
    Json(count > 0)
}
