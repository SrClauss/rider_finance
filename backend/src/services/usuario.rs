use axum::{Json, response::IntoResponse};
use axum_extra::extract::cookie::CookieJar;
use serde::{Deserialize, Serialize};
use crate::db;
use diesel::prelude::*;
use crate::schema::usuarios::dsl::*;
use crate::services::auth::login::extract_user_id_from_cookie;
use hyper::StatusCode;

#[derive(Serialize)]
struct ResetAllResponse {
    success: bool,
    message: Option<String>,
}

pub async fn reset_all_user_data_handler(cookie_jar: CookieJar) -> impl IntoResponse {
    let conn = &mut db::establish_connection();

    let user_id = match extract_user_id_from_cookie(&cookie_jar) {
        Some(uid) => uid,
        None => return (StatusCode::UNAUTHORIZED, Json(ResetAllResponse { success: false, message: Some("Usuário não autenticado".to_string()) })).into_response(),
    };

    // Use transaction to ensure atomicity
    let res = conn.transaction::<(), diesel::result::Error, _>(|conn_tx| {
        // Delete transactions belonging to user
        let _ = diesel::delete(crate::schema::transacoes::dsl::transacoes.filter(crate::schema::transacoes::dsl::id_usuario.eq(&user_id))).execute(conn_tx)?;
        // Delete work sessions
        let _ = diesel::delete(crate::schema::sessoes_trabalho::dsl::sessoes_trabalho.filter(crate::schema::sessoes_trabalho::dsl::id_usuario.eq(&user_id))).execute(conn_tx)?;
        // Delete metas
        let _ = diesel::delete(crate::schema::metas::dsl::metas.filter(crate::schema::metas::dsl::id_usuario.eq(&user_id))).execute(conn_tx)?;
    // Nota: assinaturas NÃO serão deletadas pelo reset (preservar assinaturas do usuário)
        // Delete categorias of user
        let _ = diesel::delete(crate::schema::categorias::dsl::categorias.filter(crate::schema::categorias::dsl::id_usuario.eq(Some(user_id.clone())))).execute(conn_tx)?;
        // Delete configuracoes of user
        let _ = diesel::delete(crate::schema::configuracoes::dsl::configuracoes.filter(crate::schema::configuracoes::dsl::id_usuario.eq(Some(user_id.clone())))).execute(conn_tx)?;

        // Recreate initial categories (only Corrida Uber and Corrida 99 as per new seed)
        let now = chrono::Utc::now().naive_utc();
        let defaults = vec![
            crate::models::NewCategoria { id: ulid::Ulid::new().to_string(), id_usuario: Some(user_id.clone()), nome: "Corrida Uber".to_string(), tipo: "entrada".to_string(), icone: Some("icon-uber".to_string()), cor: Some("#000000".to_string()), criado_em: now, atualizado_em: now },
            crate::models::NewCategoria { id: ulid::Ulid::new().to_string(), id_usuario: Some(user_id.clone()), nome: "Corrida 99".to_string(), tipo: "entrada".to_string(), icone: Some("icon-99".to_string()), cor: Some("#111111".to_string()), criado_em: now, atualizado_em: now },
        ];
        let _ = diesel::insert_into(crate::schema::categorias::dsl::categorias).values(&defaults).execute(conn_tx)?;

        // Recreate default public configuracoes (copy from system defaults)
        use crate::schema::configuracoes::dsl as cfg_dsl;
        let allowed = vec!["projecao_metodo","projecao_percentual_extremos","mask_moeda"];
        let padroes: Vec<crate::models::configuracao::Configuracao> = cfg_dsl::configuracoes
            .filter(cfg_dsl::id_usuario.is_null().and(cfg_dsl::chave.eq_any(&allowed)))
            .load(conn_tx)
            .unwrap_or_default();
        let mut to_insert: Vec<crate::models::configuracao::NewConfiguracao> = Vec::new();
        for cfg in padroes.into_iter() {
            to_insert.push(crate::models::configuracao::NewConfiguracao { id: ulid::Ulid::new().to_string(), id_usuario: Some(user_id.clone()), chave: cfg.chave, valor: cfg.valor, categoria: cfg.categoria, descricao: cfg.descricao, tipo_dado: cfg.tipo_dado, eh_publica: cfg.eh_publica, criado_em: now, atualizado_em: now });
        }
        if !to_insert.is_empty() {
            let _ = diesel::insert_into(cfg_dsl::configuracoes).values(&to_insert).execute(conn_tx)?;
        }

        Ok(())
    });

    match res {
        Ok(_) => (StatusCode::OK, Json(ResetAllResponse { success: true, message: None })).into_response(),
    Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ResetAllResponse { success: false, message: Some(format!("Falha ao resetar dados: {e}")) })).into_response(),
    }
}

#[derive(Serialize)]
struct PreviewResetResponse {
    transactions: i64,
    sessions: i64,
    metas: i64,
    assinaturas: i64,
    categorias: i64,
    configuracoes: i64,
    // indicates whether assinaturas will be deleted by the reset (false = preserved)
    will_delete_assinaturas: bool,
}

pub async fn preview_reset_handler(cookie_jar: CookieJar) -> impl IntoResponse {
    let conn = &mut db::establish_connection();

    let user_id = match extract_user_id_from_cookie(&cookie_jar) {
        Some(uid) => uid,
        None => return (StatusCode::UNAUTHORIZED, Json("Usuário não autenticado".to_string())).into_response(),
    };

    // Count records
    let transactions: i64 = crate::schema::transacoes::dsl::transacoes
        .filter(crate::schema::transacoes::dsl::id_usuario.eq(&user_id)).count().get_result(conn).unwrap_or(0);
    let sessions: i64 = crate::schema::sessoes_trabalho::dsl::sessoes_trabalho
        .filter(crate::schema::sessoes_trabalho::dsl::id_usuario.eq(&user_id)).count().get_result(conn).unwrap_or(0);
    let metas: i64 = crate::schema::metas::dsl::metas
        .filter(crate::schema::metas::dsl::id_usuario.eq(&user_id)).count().get_result(conn).unwrap_or(0);
    let assinaturas: i64 = crate::schema::assinaturas::dsl::assinaturas
        .filter(crate::schema::assinaturas::dsl::id_usuario.eq(&user_id)).count().get_result(conn).unwrap_or(0);
    let categorias: i64 = crate::schema::categorias::dsl::categorias
        .filter(crate::schema::categorias::dsl::id_usuario.eq(Some(user_id.clone()))).count().get_result(conn).unwrap_or(0);
    let configuracoes: i64 = crate::schema::configuracoes::dsl::configuracoes
        .filter(crate::schema::configuracoes::dsl::id_usuario.eq(Some(user_id.clone()))).count().get_result(conn).unwrap_or(0);

    Json(PreviewResetResponse { transactions, sessions, metas, assinaturas, categorias, configuracoes, will_delete_assinaturas: false }).into_response()
}

#[derive(Deserialize)]
pub struct EnderecoDTO {
    pub rua: Option<String>,
    pub numero: Option<String>,
    pub complemento: Option<String>,
    pub cidade: Option<String>,
    pub estado: Option<String>,
    pub cep: Option<String>,
}

#[derive(Deserialize)]
pub struct UpdateMeRequest {
    pub email: Option<String>,
    pub endereco: Option<EnderecoDTO>,
}

#[derive(Serialize)]
struct UpdateMeResponse {
    pub success: bool,
}

pub async fn update_me_handler(cookie_jar: CookieJar, Json(payload): Json<UpdateMeRequest>) -> impl IntoResponse {
    let conn = &mut db::establish_connection();

    let user_id = match extract_user_id_from_cookie(&cookie_jar) {
        Some(uid) => uid,
        None => return (StatusCode::UNAUTHORIZED, Json("Usuário não autenticado".to_string())).into_response(),
    };

    // Atualizar email se fornecido
    if let Some(new_email) = payload.email {
        if !new_email.contains('@') {
            return (StatusCode::BAD_REQUEST, Json("Email inválido".to_string())).into_response();
        }
        // checar unicidade do email
        let existing_res: Result<crate::models::Usuario, diesel::result::Error> = usuarios.filter(email.eq(&new_email)).first(conn);
        if let Ok(existing) = existing_res {
            if existing.id != user_id {
                return (StatusCode::CONFLICT, Json("Email já em uso".to_string())).into_response();
            }
        }
        if let Err(_e) = diesel::update(usuarios.filter(id.eq(&user_id)))
            .set(email.eq(new_email))
            .execute(conn)
        {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json("Falha ao atualizar email".to_string())).into_response();
        }
    }

    // Atualizar campos de endereço se fornecidos
    if let Some(end) = payload.endereco {
        let mut changes = Vec::<(String, String)>::new();
        if let Some(rua) = end.rua { changes.push(("address".to_string(), rua)); }
        if let Some(numero) = end.numero { changes.push(("address_number".to_string(), numero)); }
        if let Some(complemento) = end.complemento { changes.push(("complement".to_string(), complemento)); }
        if let Some(cep) = end.cep { changes.push(("postal_code".to_string(), cep)); }
        if let Some(cidade) = end.cidade { changes.push(("city".to_string(), cidade)); }
        if let Some(estado) = end.estado { changes.push(("province".to_string(), estado)); }

        // Aplicar updates individualmente (simplicidade) dentro de transação
        if let Err(_e) = conn.transaction::<_, diesel::result::Error, _>(|conn_tx| {
            for (col, val) in &changes {
                match col.as_str() {
                    "address" => { diesel::update(usuarios.filter(id.eq(&user_id))).set(address.eq(val)).execute(conn_tx)?; }
                    "address_number" => { diesel::update(usuarios.filter(id.eq(&user_id))).set(address_number.eq(val)).execute(conn_tx)?; }
                    "complement" => { diesel::update(usuarios.filter(id.eq(&user_id))).set(complement.eq(val)).execute(conn_tx)?; }
                    "postal_code" => { diesel::update(usuarios.filter(id.eq(&user_id))).set(postal_code.eq(val)).execute(conn_tx)?; }
                    "city" => { diesel::update(usuarios.filter(id.eq(&user_id))).set(city.eq(val)).execute(conn_tx)?; }
                    "province" => { diesel::update(usuarios.filter(id.eq(&user_id))).set(province.eq(val)).execute(conn_tx)?; }
                    _ => {}
                }
            }
            Ok(())
        }) {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json("Falha ao atualizar endereco".to_string())).into_response();
        }
    }

    (StatusCode::OK, Json(UpdateMeResponse { success: true })).into_response()
}

// Admin: Deleta usuário e todas as entidades relacionadas via cascade
pub async fn delete_user_and_related_handler(axum::extract::Path(user_id): axum::extract::Path<String>) -> impl IntoResponse {
    let conn = &mut db::establish_connection();
    // usar transação para segurança, embora FKs com cascade façam o trabalho
    let res = conn.transaction::<(), diesel::result::Error, _>(|conn_tx| {
        // deletar o usuário — as FKs com ON DELETE CASCADE devem remover related rows
        diesel::delete(usuarios.filter(id.eq(&user_id))).execute(conn_tx)?;
        Ok(())
    });

    match res {
        Ok(_) => (hyper::StatusCode::OK, Json(serde_json::json!({"ok": true}))).into_response(),
        Err(e) => (hyper::StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"ok": false, "error": format!("{}", e)}))).into_response(),
    }
}


#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::establish_connection;
    use crate::models::NewUsuario;
    use axum_extra::extract::cookie::{Cookie, CookieJar};
    use serial_test::serial;

    fn clean_db() {
        std::env::set_var("ENVIRONMENT", "tests");
        let conn = &mut establish_connection();
        diesel::delete(crate::schema::usuarios::dsl::usuarios).execute(conn).ok();
    }

    #[tokio::test]
    #[serial]
    async fn test_update_me_handler() {
        clean_db();
        let conn = &mut establish_connection();

        // cria usuário
        let user_id = ulid::Ulid::new().to_string();
        let now = chrono::Utc::now().naive_utc();
        let new_user = NewUsuario {
            id: user_id.clone(),
            nome_usuario: "user_test".to_string(),
            email: "teste@teste.com".to_string(),
            senha: "senha123".to_string(),
            nome_completo: "Teste".to_string(),
            telefone: "11999999999".to_string(),
            veiculo: "Carro".to_string(),
            blocked: false,
            blocked_date: None,
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
        diesel::insert_into(crate::schema::usuarios::dsl::usuarios).values(&new_user).execute(conn).unwrap();

        // gerar token JWT compatível
        let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
        let claims = crate::services::dashboard::Claims { sub: user_id.clone(), email: new_user.email.clone(), exp: 9999999999 };
        let token = jsonwebtoken::encode(&jsonwebtoken::Header::default(), &claims, &jsonwebtoken::EncodingKey::from_secret(secret.as_ref())).unwrap();
        let jar = CookieJar::new().add(Cookie::new("auth_token", token));

        // preparar payload de atualização
        let endereco = EnderecoDTO { rua: Some("Rua Nova".to_string()), numero: Some("10".to_string()), complemento: Some("".to_string()), cidade: Some("Cidade Nova".to_string()), estado: Some("SP".to_string()), cep: Some("01234567".to_string()) };
        let payload = UpdateMeRequest { email: Some("novo@teste.com".to_string()), endereco: Some(endereco) };

        let resp = update_me_handler(jar, axum::Json(payload)).await.into_response();
        assert_eq!(resp.status(), hyper::StatusCode::OK);

        // verificar DB
        let updated: crate::models::Usuario = crate::schema::usuarios::dsl::usuarios.find(&user_id).first(conn).unwrap();
        assert_eq!(updated.email, "novo@teste.com");
        assert_eq!(updated.address, "Rua Nova");
        assert_eq!(updated.city, "Cidade Nova");
        assert_eq!(updated.province, "SP");
    }

    #[tokio::test]
    #[serial]
    async fn test_update_me_invalid_email() {
        clean_db();
        let conn = &mut establish_connection();

        let user_id = ulid::Ulid::new().to_string();
        let now = chrono::Utc::now().naive_utc();
        let new_user = NewUsuario {
            id: user_id.clone(),
            nome_usuario: "user_test2".to_string(),
            email: "teste2@teste.com".to_string(),
            senha: "senha123".to_string(),
            nome_completo: "Teste".to_string(),
            telefone: "11999999999".to_string(),
            veiculo: "Moto".to_string(),
            blocked: false,
            blocked_date: None,
            criado_em: now,
            atualizado_em: now,
            ultima_tentativa_redefinicao: now,
            address: "Rua Teste".to_string(),
            address_number: "123".to_string(),
            complement: "Apto 1".to_string(),
            postal_code: "01234567".to_string(),
            province: "Centro".to_string(),
            city: "São Paulo".to_string(),
            cpfcnpj: "12345678901".to_string(),
        };
        diesel::insert_into(crate::schema::usuarios::dsl::usuarios).values(&new_user).execute(conn).unwrap();

        let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
        let claims = crate::services::dashboard::Claims { sub: user_id.clone(), email: new_user.email.clone(), exp: 9999999999 };
        let token = jsonwebtoken::encode(&jsonwebtoken::Header::default(), &claims, &jsonwebtoken::EncodingKey::from_secret(secret.as_ref())).unwrap();
        let jar = CookieJar::new().add(Cookie::new("auth_token", token));

        // email inválido sem '@'
        let payload = UpdateMeRequest { email: Some("invalidoemail".to_string()), endereco: None };
        let resp = update_me_handler(jar, axum::Json(payload)).await.into_response();
        assert_eq!(resp.status(), hyper::StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    #[serial]
    async fn test_update_me_unauthenticated() {
        clean_db();
        let conn = &mut establish_connection();

        let user_id = ulid::Ulid::new().to_string();
        let now = chrono::Utc::now().naive_utc();
        let new_user = NewUsuario {
            id: user_id.clone(),
            nome_usuario: "user_test3".to_string(),
            email: "teste3@teste.com".to_string(),
            senha: "senha123".to_string(),
            nome_completo: "Teste".to_string(),
            telefone: "11999999999".to_string(),
            veiculo: "Bicicleta".to_string(),
            blocked: false,
            blocked_date: None,
            criado_em: now,
            atualizado_em: now,
            ultima_tentativa_redefinicao: now,
            address: "Rua Teste".to_string(),
            address_number: "123".to_string(),
            complement: "Apto 1".to_string(),
            postal_code: "01234567".to_string(),
            province: "Centro".to_string(),
            city: "São Paulo".to_string(),
            cpfcnpj: "12345678902".to_string(),
        };
        diesel::insert_into(crate::schema::usuarios::dsl::usuarios).values(&new_user).execute(conn).unwrap();

        // sem cookie de autenticação
        let jar = CookieJar::new();
        let payload = UpdateMeRequest { email: Some("novo@teste.com".to_string()), endereco: None };
        let resp = update_me_handler(jar, axum::Json(payload)).await.into_response();
        assert_eq!(resp.status(), hyper::StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    #[serial]
    async fn test_update_me_email_conflict() {
        clean_db();
        let conn = &mut establish_connection();

        // cria usuário A
        let user_a = ulid::Ulid::new().to_string();
        let user_b = ulid::Ulid::new().to_string();
        let now = chrono::Utc::now().naive_utc();
        let new_user_a = NewUsuario {
            id: user_a.clone(),
            nome_usuario: "user_a".to_string(),
            email: "a@teste.com".to_string(),
            senha: "senha123".to_string(),
            nome_completo: "A".to_string(),
            telefone: "11999990000".to_string(),
            veiculo: "Carro".to_string(),
            blocked: false,
            blocked_date: None,
            criado_em: now,
            atualizado_em: now,
            ultima_tentativa_redefinicao: now,
            address: "Rua A".to_string(),
            address_number: "1".to_string(),
            complement: "".to_string(),
            postal_code: "00000000".to_string(),
            province: "P".to_string(),
            city: "C".to_string(),
            cpfcnpj: "11111111111".to_string(),
        };
        let new_user_b = NewUsuario {
            id: user_b.clone(),
            nome_usuario: "user_b".to_string(),
            email: "b@teste.com".to_string(),
            senha: "senha123".to_string(),
            nome_completo: "B".to_string(),
            telefone: "11999990001".to_string(),
            veiculo: "Moto".to_string(),
            blocked: false,
            blocked_date: None,
            criado_em: now,
            atualizado_em: now,
            ultima_tentativa_redefinicao: now,
            address: "Rua B".to_string(),
            address_number: "2".to_string(),
            complement: "".to_string(),
            postal_code: "11111111".to_string(),
            province: "P".to_string(),
            city: "C".to_string(),
            cpfcnpj: "22222222222".to_string(),
        };
        diesel::insert_into(crate::schema::usuarios::dsl::usuarios).values(&new_user_a).execute(conn).unwrap();
        diesel::insert_into(crate::schema::usuarios::dsl::usuarios).values(&new_user_b).execute(conn).unwrap();

        // gerar token para user_b e tentar atualizar para email de user_a
        let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
        let claims = crate::services::dashboard::Claims { sub: user_b.clone(), email: new_user_b.email.clone(), exp: 9999999999 };
        let token = jsonwebtoken::encode(&jsonwebtoken::Header::default(), &claims, &jsonwebtoken::EncodingKey::from_secret(secret.as_ref())).unwrap();
        let jar = CookieJar::new().add(Cookie::new("auth_token", token));

        let payload = UpdateMeRequest { email: Some(new_user_a.email.clone()), endereco: None };
        let resp = update_me_handler(jar, axum::Json(payload)).await.into_response();
        assert_eq!(resp.status(), hyper::StatusCode::CONFLICT);
    }
}
