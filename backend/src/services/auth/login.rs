use axum_extra::extract::cookie::CookieJar;
use jsonwebtoken::{DecodingKey, Validation, decode, Algorithm};
/// Extrai o id_usuario do cookie http-only (JWT)
pub fn extract_user_id_from_cookie(jar: &CookieJar) -> Option<String> {
    let cookie = jar.get("auth_token")?;
    let token = cookie.value();
    let decoding_key = DecodingKey::from_secret(std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string()).as_bytes());
    let validation = Validation::new(Algorithm::HS256);
    let token_data = decode::<Claims>(token, &decoding_key, &validation).ok()?;
    Some(token_data.claims.sub)
}
#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::Usuario;
    use axum::http::StatusCode;
    use axum::Json;
    use axum::response::IntoResponse;

    #[tokio::test]
    async fn test_login_handler_usuario_nao_encontrado() {
        let payload = LoginPayload {
            usuario: "naoexiste".to_string(),
            senha: "senha".to_string(),
        };
        let resp = login_handler(Json(payload)).await.into_response();
        assert_eq!(resp.status(), StatusCode::UNAUTHORIZED);
    }

    #[test]
    fn test_login_sucesso_ou_falha() {
        let now = chrono::Utc::now().naive_utc();
        let usuario = Usuario {
            id: "1".to_string(),
            nome_usuario: "teste".to_string(),
            email: "teste@teste.com".to_string(),
            senha: bcrypt::hash("senha123", bcrypt::DEFAULT_COST).unwrap(),
            nome_completo: "Nome Completo".to_string(),
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
        // Senha correta
        let token = super::login(&usuario, "senha123");
        assert!(token.is_ok());
        // Senha errada
        let token = super::login(&usuario, "errada");
        assert!(token.is_err());
    }
}

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
#[derive(Serialize, Deserialize)]
struct Claims {
    sub: String,
    email: String,
    exp: usize,
}


pub fn login(usuario: &Usuario, senha_plain: &str) -> Result<String, String> {
    // usuario.senha é String (hash da senha)
    if verify(senha_plain, usuario.senha.as_ref()).map_err(|_| "Erro ao verificar senha".to_string())? {
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
