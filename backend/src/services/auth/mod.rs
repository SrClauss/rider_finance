use axum::{Json, extract::Path};
use diesel::prelude::*;
use diesel::QueryDsl;
use diesel::ExpressionMethods;
use serde::Deserialize;
use crate::models::NewUsuario;
use crate::models::usuarios::dsl::*;
use crate::db;
use crate::models::Usuario;

#[derive(Deserialize)]
pub struct LoginPayload {
    pub usuario: String,
    pub senha: String,
}

pub async fn login_handler(Json(payload): Json<LoginPayload>) -> Json<serde_json::Value> {
    let conn = &mut db::establish_connection();
    match usuarios.filter(nome_usuario.eq(&payload.usuario)).first::<Usuario>(conn) {
        Ok(user) => {
            match crate::services::auth::login::login(&user, &payload.senha) {
                Ok(token) => {
                    let resp = serde_json::json!({
                        "message": format!("Login bem-sucedido: {}", user.nome_usuario),
                        "token": token
                    });
                    Json(resp)
                },
                Err(e) => {
                    let resp = serde_json::json!({
                        "message": format!("Erro de login: {}", e),
                        "token": null
                    });
                    Json(resp)
                },
            }
        }
        Err(_) => {
            let resp = serde_json::json!({
                "message": "Erro de login: usuário não encontrado",
                "token": null
            });
            Json(resp)
        },
    }
}

#[derive(Deserialize)]
pub struct RegisterPayload {
    pub nome_usuario: String,
    pub email: String,
    pub senha: String,
}

pub async fn register_user_handler(Json(payload): Json<RegisterPayload>) -> Json<String> {
    let usuario = NewUsuario::new(
        None,
        payload.nome_usuario,
        payload.email,
        payload.senha,
        None, // nome_completo
        None, // telefone
        None, // veiculo
        None, // data_inicio_atividade
        false, // eh_pago
        None, // id_pagamento
        None, // metodo_pagamento
        None, // status_pagamento
        None, // tipo_assinatura
        None, // trial_termina_em
        None, // criado_em
        None, // atualizado_em
    );
    match crate::services::auth::register::register_user(usuario) {
        Ok(_) => Json("Usuário registrado com sucesso".to_string()),
        Err(e) => Json(format!("Erro: {}", e)),
    }
}

#[derive(Deserialize)]
pub struct RegisterPendingPayload {
    pub nome_usuario: String,
    pub email: String,
}

pub async fn register_pending_user_handler(Json(payload): Json<RegisterPendingPayload>) -> Json<String> {
    let usuario = NewUsuario::new(
        None,
        payload.nome_usuario,
        payload.email,
        "".to_string(),
        None, None, None, None, false, None, None, None, None, None, None, None
    );
    match crate::services::auth::register_pending::register_pending_user(usuario) {
        Ok(_) => Json("Usuário pendente registrado com sucesso".to_string()),
        Err(e) => Json(format!("Erro: {}", e)),
    }
}

#[derive(Deserialize)]
pub struct ResetPasswordPayload {
    pub nova_senha: String,
}

pub async fn reset_password_handler(Path(user_id): Path<String>, Json(payload): Json<ResetPasswordPayload>) -> Json<String> {
    match crate::services::auth::reset_password::reset_password(&user_id, &payload.nova_senha) {
        Ok(_) => Json("Senha redefinida com sucesso".to_string()),
        Err(e) => Json(format!("Erro: {}", e)),
    }
}

#[cfg(test)]
mod tests {
    use crate::db;
    use crate::models::NewUsuario;
    use diesel::prelude::*;
    use diesel::dsl::{exists, select};

    fn clean_db() {
        let conn = &mut db::establish_connection();
        use crate::models::usuarios::dsl::*;
        diesel::delete(usuarios).execute(conn).ok();
    }

    #[test]
    fn test_register_user_missing_optional_fields() {
        clean_db();
        // Não preenche campos opcionais
        let usuario = NewUsuario::new(
            None,
            "useropt".to_string(),
            "useropt@email.com".to_string(),
            "senha123".to_string(),
            None, None, None, None, false, None, None, None, None, None, None, None
        );
        let res = crate::services::auth::register::register_user(usuario);
        assert!(res.is_ok(), "Usuário sem campos opcionais deveria ser registrado");
    }

    #[test]
    fn test_register_user_empty_required_fields() {
        clean_db();
        // Campos obrigatórios vazios
        let usuario = NewUsuario::new(
            None,
            "".to_string(), // nome_usuario vazio
            "".to_string(), // email vazio
            "".to_string(), // senha vazia
            None, None, None, None, false, None, None, None, None, None, None, None
        );
        let res = crate::services::auth::register::register_user(usuario);
        assert!(res.is_err(), "Cadastro com campos obrigatórios vazios deveria falhar");
    }

    #[test]
    fn test_register_user_duplicate_email_or_username() {
        clean_db();
        let usuario1 = NewUsuario::new(
            None,
            "dupuser".to_string(),
            "dup@email.com".to_string(),
            "senha123".to_string(),
            None, None, None, None, false, None, None, None, None, None, None, None
        );
        let usuario2 = NewUsuario::new(
            None,
            "dupuser".to_string(), // nome_usuario duplicado
            "dup@email.com".to_string(), // email duplicado
            "senha123".to_string(),
            None, None, None, None, false, None, None, None, None, None, None, None
        );
        let res1 = crate::services::auth::register::register_user(usuario1);
        assert!(res1.is_ok(), "Primeiro cadastro deveria funcionar");
        let res2 = crate::services::auth::register::register_user(usuario2);
        assert!(res2.is_err(), "Cadastro duplicado deveria falhar");
    }

    #[test]
    fn test_serialization_and_long_strings() {
        use serde_json;
        // Strings longas
        let long_str = "a".repeat(5000);
        let usuario = NewUsuario::new(
            None,
            long_str.clone(),
            format!("{}@email.com", long_str),
            long_str.clone(),
            None, None, None, None, false, None, None, None, None, None, None, None
        );
        // Serialização
        let ser = serde_json::to_string(&usuario);
        assert!(ser.is_ok(), "Serialização de usuário com strings longas deve funcionar");
        // Deserialização
        let deser: Result<NewUsuario, _> = serde_json::from_str(&ser.unwrap());
        assert!(deser.is_ok(), "Deserialização de usuário com strings longas deve funcionar");
    }

    #[test]
    fn test_register_user() {
        clean_db();
        let usuario = NewUsuario::new(
            None,
            "testuser".to_string(),
            "test@email.com".to_string(),
            "senha123".to_string(),
            None, None, None, None, false, None, None, None, None, None, None, None
        );
        let res = crate::services::auth::register::register_user(usuario.clone());
        assert!(res.is_ok());
        // Verifica se o usuário está no banco
        let conn = &mut db::establish_connection();
        use crate::models::usuarios::dsl::*;
        let found: bool = select(exists(usuarios.filter(email.eq("test@email.com")))).get_result(conn).unwrap();
        assert!(found, "Usuário não encontrado no banco de dados");
    }

    #[test]
    fn test_register_pending_user() {
        clean_db();
        let usuario = NewUsuario::new(
            None,
            "pendinguser".to_string(),
            "pending@email.com".to_string(),
            "".to_string(),
            None, None, None, None, false, None, None, None, None, None, None, None
        );
        let res = crate::services::auth::register_pending::register_pending_user(usuario);
        assert!(res.is_ok());
    }

    #[test]
    fn test_reset_password() {
        clean_db();
        let usuario = NewUsuario::new(
            None,
            "resetuser".to_string(),
            "reset@email.com".to_string(),
            "senha123".to_string(),
            None, None, None, None, false, None, None, None, None, None, None, None
        );
        let _ = crate::services::auth::register::register_user(usuario.clone());
        let res = crate::services::auth::reset_password::reset_password(&usuario.id, "nova_senha");
        assert!(res.is_ok());
    }

    #[test]
    fn test_login_service() {
        clean_db();
        let usuario = NewUsuario::new(
            None,
            "serviceuser".to_string(),
            "service@email.com".to_string(),
            "senha123".to_string(),
            None, None, None, None, false, None, None, None, None, None, None, None
        );
        let _ = crate::services::auth::register::register_user(usuario.clone());
        // Busca usuário do banco
        let conn = &mut db::establish_connection();
        use crate::models::usuarios::dsl::*;
        let user: crate::models::Usuario = usuarios
            .filter(nome_usuario.eq("serviceuser"))
            .first(conn)
            .unwrap();
        // Login correto
        let ok = crate::services::auth::login::login(&user, "senha123");
        assert!(ok.is_ok());
        // Login errado
        let fail = crate::services::auth::login::login(&user, "errada");
        assert!(fail.is_err());
    }
}
pub mod register;
pub mod register_pending;
pub mod reset_password;
pub mod login;
