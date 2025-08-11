use serde::Deserialize;
pub use crate::services::auth::register::register_user_handler;
pub use crate::services::auth::register_pending::register_pending_user_handler;
pub use crate::services::auth::reset_password::reset_password_handler;
pub mod request_password_reset;
pub use crate::services::auth::request_password_reset::request_password_reset_handler;
pub mod validate_token;
pub mod logout;

#[cfg(test)]
mod tests {
    use crate::services::auth::request_password_reset::{request_password_reset_handler, RequestPasswordResetPayload};
    use axum::Json;
    use crate::schema::usuarios::dsl::{usuarios, email, nome_usuario};

    #[tokio::test]
    async fn test_request_password_reset_handler() {
        clean_db();
        // Cria usuário no banco
        let usuario = NewUsuario::new(
            None,
            "resetuser".to_string(),
            "reset@email.com".to_string(),
            "senha123".to_string(),
            None, None, None, None, false, None, None, None, None, None, None, None,
            "Rua Teste".to_string(), "123".to_string(), "Apto 1".to_string(), "12345-678".to_string(), "SP".to_string(), "São Paulo".to_string(), None
        );
        let conn = &mut db::establish_connection_test();
        diesel::insert_into(usuarios)
            .values(&usuario)
            .execute(conn)
            .unwrap();

        // Testa envio permitido
        let payload = RequestPasswordResetPayload { email: "reset@email.com".to_string() };
        let response = request_password_reset_handler(Json(payload)).await;
        assert_eq!(response.0, "Email de redefinição de senha enviado (simulado)");

        // Força update do campo ultima_tentativa_redefinicao para simular bloqueio
        use diesel::dsl::now;
        diesel::update(usuarios.filter(email.eq("reset@email.com")))
            .set(crate::schema::usuarios::ultima_tentativa_redefinicao.eq(now))
            .execute(conn)
            .unwrap();

        // Testa bloqueio por tempo
        let payload = RequestPasswordResetPayload { email: "reset@email.com".to_string() };
        let response = request_password_reset_handler(Json(payload)).await;
        assert_eq!(response.0, "Já foi solicitado recentemente. Aguarde 4 horas para nova tentativa.");

        // Testa usuário inexistente
        let payload = RequestPasswordResetPayload { email: "naoexiste@email.com".to_string() };
        let response = request_password_reset_handler(Json(payload)).await;
        assert_eq!(response.0, "Usuário não encontrado");
    }
    use crate::db;
    use crate::models::NewUsuario;
    use diesel::prelude::*;
    use diesel::dsl::{exists, select};

    fn clean_db() {
        let conn = &mut db::establish_connection_test();
        // dsl já importado no topo
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
            None, None, None, None, false, None, None, None, None, None, None, None,
            "Rua Teste".to_string(), "123".to_string(), "Apto 1".to_string(), "12345-678".to_string(), "SP".to_string(), "São Paulo".to_string(), None
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
            None, None, None, None, false, None, None, None, None, None, None, None,
            "Rua Teste".to_string(), "123".to_string(), "Apto 1".to_string(), "12345-678".to_string(), "SP".to_string(), "São Paulo".to_string(), None
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
            None, None, None, None, false, None, None, None, None, None, None, None,
            "Rua Teste".to_string(), "123".to_string(), "Apto 1".to_string(), "12345-678".to_string(), "SP".to_string(), "São Paulo".to_string(), None
        );
        let usuario2 = NewUsuario::new(
            None,
            "dupuser".to_string(), // nome_usuario duplicado
            "dup@email.com".to_string(), // email duplicado
            "senha123".to_string(),
            None, None, None, None, false, None, None, None, None, None, None, None,
            "Rua Teste".to_string(), "123".to_string(), "Apto 1".to_string(), "12345-678".to_string(), "SP".to_string(), "São Paulo".to_string(), None
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
            None, None, None, None, false, None, None, None, None, None, None, None,
            long_str.clone(), long_str.clone(), long_str.clone(), long_str.clone(), long_str.clone(), long_str.clone(), None
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
            None, None, None, None, false, None, None, None, None, None, None, None,
            "Rua Teste".to_string(), "123".to_string(), "Apto 1".to_string(), "12345-678".to_string(), "SP".to_string(), "São Paulo".to_string(), None
        );
        let res = crate::services::auth::register::register_user(usuario.clone());
        assert!(res.is_ok());
        // Verifica se o usuário está no banco
        let conn = &mut db::establish_connection_test();
        // dsl já importado no topo
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
            None, None, None, None, false, None, None, None, None, None, None, None,
            "Rua Teste".to_string(), "123".to_string(), "Apto 1".to_string(), "12345-678".to_string(), "SP".to_string(), "São Paulo".to_string(), None
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
            None, None, None, None, false, None, None, None, None, None, None, None,
            "Rua Teste".to_string(), "123".to_string(), "Apto 1".to_string(), "12345-678".to_string(), "SP".to_string(), "São Paulo".to_string(), None
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
            None, None, None, None, false, None, None, None, None, None, None, None,
            "Rua Teste".to_string(), "123".to_string(), "Apto 1".to_string(), "12345-678".to_string(), "SP".to_string(), "São Paulo".to_string(), None
        );
        let _ = crate::services::auth::register::register_user(usuario.clone());
        // Busca usuário do banco
        let conn = &mut db::establish_connection_test();
        // dsl já importado no topo
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

pub use crate::services::auth::login::login_handler;

#[derive(Deserialize, Debug)]
pub struct RegisterPayload {
    pub nome_usuario: String,
    pub email: String,
    pub senha: String,
}
