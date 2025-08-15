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
use axum::{Json};
use serde::Deserialize;
use crate::models::Usuario;
use crate::db;
use chrono::{Utc, Duration};
use diesel::prelude::*;
use crate::schema::usuarios::dsl::*;
use crate::schema::usuarios::{email, id, ultima_tentativa_redefinicao};

#[derive(Deserialize)]
pub struct RequestPasswordResetPayload {
    pub email: String,
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
            // Simular envio de email
            let token = format!("token-{}", usuario.id); // Aqui você pode usar JWT ou outro método
            let link = format!("https://site.com/{}", token);
            let corpo_email = format!("<html><body><a href='{}'>Redefinir senha</a></body></html>", link);
            println!("Simulando envio de email para {}: {}", usuario.email, corpo_email);
            // Atualizar ultima_tentativa_redefinicao
            diesel::update(usuarios.filter(id.eq(&usuario.id)))
                .set(ultima_tentativa_redefinicao.eq(now))
                .execute(conn)
                .ok();
            Json("Email de redefinição de senha enviado (simulado)".to_string())
        }
        Err(_) => Json("Usuário não encontrado".to_string()),
    }
}
