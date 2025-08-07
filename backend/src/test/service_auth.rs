// Testes unitários migrados de tests/service/service_auth.rs
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
