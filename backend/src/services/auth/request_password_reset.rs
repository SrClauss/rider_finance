#[cfg(test)]
mod tests {
    use super::*;
    use axum::Json;

    #[tokio::test]
    async fn test_request_password_reset_handler_usuario_inexistente() {
        let payload = RequestPasswordResetPayload {
            email: "naoexiste@teste.com".to_string(),
        };
        let resp = request_password_reset_handler(Json(payload)).await;
        let msg = resp.0;
        assert!(msg.contains("não encontrado"));
    }
}
use axum::Json;
use serde::Deserialize;
use crate::models::Usuario;
use crate::db;
use chrono::{Utc, Duration};
use diesel::prelude::*;
use crate::schema::usuarios::dsl::*;
use crate::schema::usuarios::{email, id, ultima_tentativa_redefinicao};
use std::env;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};
use jsonwebtoken::{encode, EncodingKey, Header};
use serde::Serialize;

#[derive(Deserialize)]
pub struct RequestPasswordResetPayload {
    pub email: String,
}

#[derive(Serialize)]
struct Claims {
    sub: String,
    exp: usize,
}

pub async fn request_password_reset_handler(Json(payload): Json<RequestPasswordResetPayload>) -> Json<String> {
    let conn = &mut db::establish_connection();
    // Buscar usuário pelo email
    let usuario_result = usuarios
        .filter(email.eq(&payload.email))
        .first::<Usuario>(conn);

    match usuario_result {
        Ok(usuario) => {
            let now = Utc::now().naive_utc();
            let pode_reenviar = now - usuario.ultima_tentativa_redefinicao > Duration::hours(4);
            if !pode_reenviar {
                return Json("Já foi solicitado recentemente. Aguarde 4 horas para nova tentativa.".to_string());
            }
            // Gerar JWT expira em 1h
            let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "secret123".to_string());
            let exp = (Utc::now() + Duration::hours(1)).timestamp() as usize;
            let claims = Claims {
                sub: usuario.id.clone(),
                exp,
            };
                Err(e) => {
                    return Json(format!("Erro ao gerar token: {}", e));
                }
            };
            let frontend_url = env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:3000".to_string());
            let link = format!("{}/reset/{}", frontend_url, token);
            let corpo_email = format!("<html><body><p>Para redefinir sua senha, clique no link abaixo:</p><a href='{}'>Redefinir senha</a></body></html>", link);

            // Enviar email real
            let smtp_server = env::var("YAHOO_SMTP_SERVER").unwrap_or_else(|_| "smtp.mail.yahoo.com".to_string());
            let smtp_port = env::var("YAHOO_SMTP_PORT").unwrap_or_else(|_| "465".to_string());
            let smtp_port: u16 = smtp_port.parse().unwrap_or(465);
            let smtp_user = env::var("YAHOO_EMAIL").unwrap();
            let smtp_pass = env::var("YAHOO_APP_PASSWORD").unwrap();
            let email_from = smtp_user.clone();
            let email_to = usuario.email.clone();
            let email_msg = Message::builder()
                .from(email_from.parse().unwrap())
                .to(email_to.parse().unwrap())
                .subject("Redefinição de senha - Rider Finance")
                .header(lettre::message::header::ContentType::TEXT_HTML)
                .body(corpo_email)
                .unwrap();
            let creds = Credentials::new(smtp_user, smtp_pass);
            let mailer = SmtpTransport::relay(&smtp_server)
                .unwrap()
                .port(smtp_port)
                .credentials(creds)
                .build();
            match mailer.send(&email_msg) {
                Ok(response) => {
                }
                Err(e) => {
                    return Json(format!("Erro ao enviar e-mail: {}", e));
                }
            }

            // Atualizar ultima_tentativa_redefinicao
            diesel::update(usuarios.filter(id.eq(&usuario.id)))
                .set(ultima_tentativa_redefinicao.eq(now))
                .execute(conn)
                .ok();
            Json("Email de redefinição de senha enviado com sucesso!".to_string())
        }
        Err(_) => Json("Usuário não encontrado".to_string()),
    }
}
