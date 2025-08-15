#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn test_establish_connection_test() {
        let conn = establish_connection_test();
        // Apenas verifica se a conexão foi criada (não é None)
        // PgConnection não implementa PartialEq, então só checa se não panica
        assert!(!std::ptr::eq(&conn, std::ptr::null()));
    }
    #[test]
    fn test_establish_connection() {
        let conn = establish_connection();
        assert!(!std::ptr::eq(&conn, std::ptr::null()));
    }
}
/// Conexão para banco de dados de testes
pub fn establish_connection_test() -> PgConnection {
    use std::env;
    dotenvy::from_filename(".env.test").ok();
    let database_url = env::var("TEST_DATABASE_URL").expect("TEST_DATABASE_URL não definida");
    PgConnection::establish(&database_url).expect("Erro ao conectar ao banco de testes")
}
use diesel::pg::PgConnection;
use diesel::prelude::*;
use dotenvy::dotenv;
use std::env;

pub fn establish_connection() -> PgConnection {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL")
        .expect("DATABASE_URL não definida no .env");
    PgConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Erro ao conectar no banco: {}", database_url))
}
