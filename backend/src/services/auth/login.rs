
use axum::{response::IntoResponse, Json};
use axum::http::{HeaderMap, header, StatusCode};
use serde::Deserialize;
use crate::models::Usuario;
use crate::db;
use crate::schema::usuarios::dsl::*;
use crate::schema::usuarios::{email, nome_usuario};
use diesel::QueryDsl;
use diesel::ExpressionMethods;
use diesel::BoolExpressionMethods;
use diesel::RunQueryDsl;

#[derive(Deserialize)]
pub struct LoginPayload {
    pub usuario: String,
    pub senha: String,
}

pub async fn login_handler(Json(payload): Json<LoginPayload>) -> impl IntoResponse {
    let conn = &mut db::establish_connection();
    // Busca por nome_usuario OU email
    match usuarios
        .filter(nome_usuario.eq(&payload.usuario).or(email.eq(&payload.usuario)))
        .first::<Usuario>(conn) {
        Ok(user) => {
            match crate::services::auth::login::login(&user, &payload.senha) {
                Ok(token) => {
                    // Set-Cookie: auth_token=...; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax
                    let mut headers = HeaderMap::new();
                    let cookie_value = format!("auth_token={}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax", token);
                    headers.insert(header::SET_COOKIE, cookie_value.parse().unwrap());
                    let resp = serde_json::json!({
                        "message": format!("Login bem-sucedido: {}", user.nome_usuario)
                    });
                    (StatusCode::OK, headers, Json(resp))
                },
                Err(e) => {
                    let resp = serde_json::json!({
                        "message": format!("Erro de login: {}", e)
                    });
            let headers = HeaderMap::new();
            (StatusCode::UNAUTHORIZED, headers, Json(resp))
                },
            }
        }
        Err(_) => {
            let resp = serde_json::json!({
                "message": "Erro de login: usuário não encontrado"
            });
        let headers = HeaderMap::new();
        (StatusCode::UNAUTHORIZED, headers, Json(resp))
        },
    }
}



use bcrypt::verify;
use jsonwebtoken::{encode, Header, EncodingKey};
use serde::{Serialize};

/// Payload do JWT
#[derive(Serialize)]
struct Claims {
    sub: String,
    email: String,
    exp: usize,
}


pub fn login(usuario: &Usuario, senha_plain: &str) -> Result<String, String> {
    // usuario.senha é String (hash da senha)
    if verify(senha_plain, usuario.senha.as_deref().unwrap_or("")).map_err(|_| "Erro ao verificar senha".to_string())? {
        // Gerar token JWT
        let expiration = chrono::Utc::now().timestamp() as usize + 60 * 60 * 24; // 24h
        let claims = Claims {
            sub: usuario.id.clone(),
            email: usuario.email.clone(),
            exp: expiration,
        };
        let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
        let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_ref()))
            .map_err(|e| format!("Erro ao gerar token: {}", e))?;
        Ok(token)
    } else {
        Err("Senha incorreta".to_string())
    }
}
