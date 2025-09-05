use diesel::pg::PgConnection;
use diesel::prelude::*;
use dotenvy::dotenv;
use std::env;

/// Conexão para banco de dados, decide entre produção e testes via ENVIRONMENT
pub fn establish_connection() -> PgConnection {
    // Carrega variáveis do .env padrão
    dotenv().ok();
    let environment = env::var("ENVIRONMENT").unwrap_or_else(|_| "production".to_string());
    let database_url = if environment == "tests" {
        dotenvy::from_filename(".env.test").ok();
        env::var("TEST_DATABASE_URL").expect("TEST_DATABASE_URL não definida")
    } else {
        env::var("DATABASE_URL").expect("DATABASE_URL não definida no .env")
    };
    PgConnection::establish(&database_url)
    .unwrap_or_else(|_| panic!("Erro ao conectar no banco: {database_url}"))
}
