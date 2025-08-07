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
