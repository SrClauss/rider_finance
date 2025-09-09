use diesel::pg::PgConnection;
use diesel::prelude::*;
use diesel::sql_query;
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
    let mut conn = PgConnection::establish(&database_url)
        .unwrap_or_else(|_| panic!("Erro ao conectar no banco: {database_url}"));
    
    // Força o timezone da sessão para UTC para garantir que todas as operações
    // de timestamp sejam feitas em UTC, evitando problemas de fuso horário
    sql_query("SET timezone = 'UTC'")
        .execute(&mut conn)
        .expect("Erro ao configurar timezone para UTC");
    
    // Removendo configuração global do banco de dados para UTC
    // Apenas a configuração da sessão será mantida
    
    // Verificação adicional - log do timezone aplicado
    use diesel::deserialize::QueryableByName;
    
    #[derive(QueryableByName, Debug)]
    struct TimezoneResult {
        #[diesel(sql_type = diesel::sql_types::Text)]
        timezone: String,
    }
    
    let timezone_check: Vec<TimezoneResult> = sql_query("SHOW timezone")
        .get_results(&mut conn)
        .unwrap_or_else(|_| vec![]);
    
    if let Some(tz_result) = timezone_check.first() {
        if tz_result.timezone != "UTC" {
            eprintln!("AVISO: Timezone da conexão não é UTC: {}", tz_result.timezone);
        }
    }
    
    conn
}
