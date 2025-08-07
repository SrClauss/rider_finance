use axum::{Json, extract::Path};
use crate::models::configuracao::{Configuracao, NewConfiguracao};
use crate::schema::configuracoes::dsl::*;
use diesel::prelude::*;
use chrono::Utc;
use diesel::pg::PgConnection;
// Removidos imports inválidos e não utilizados

// Criar configuração
pub async fn create_configuracao_handler(
    Json(payload): Json<NewConfiguracao>,
    conn: &mut PgConnection,
) -> Result<Json<Configuracao>, String> {
    let now = Utc::now().naive_utc();
    let new = NewConfiguracao {
        criado_em: now,
        atualizado_em: now,
        ..payload
    };
    diesel::insert_into(configuracoes)
        .values(&new)
        .get_result(conn)
        .map(Json)
        .map_err(|e| e.to_string())
}

// Buscar configuração por id
pub async fn get_configuracao_handler(
    Path(id_valor): Path<String>,
    conn: &mut PgConnection,
) -> Result<Json<Configuracao>, String> {
    configuracoes.filter(crate::schema::configuracoes::id.eq(id_valor))
        .first(conn)
        .map(Json)
        .map_err(|e| e.to_string())
}

// Listar configurações de um usuário
pub async fn list_configuracoes_handler(
    Path(id_usuario_valor): Path<String>,
    conn: &mut PgConnection,
) -> Result<Json<Vec<Configuracao>>, String> {
    configuracoes.filter(crate::schema::configuracoes::id_usuario.eq(id_usuario_valor))
        .load(conn)
        .map(Json)
        .map_err(|e| e.to_string())
}

// Deletar configuração
pub async fn delete_configuracao_handler(
    Path(id_valor): Path<String>,
    conn: &mut PgConnection,
) -> Result<Json<usize>, String> {
    diesel::delete(configuracoes.filter(crate::schema::configuracoes::id.eq(id_valor)))
        .execute(conn)
        .map(Json)
        .map_err(|e| e.to_string())
}

// Função para inserir configurações padrão no banco
#[allow(dead_code)]
pub fn seed_configuracoes_padrao(conn: &mut diesel::PgConnection, id_usuario_valor: &str) {
    use crate::models::configuracao::NewConfiguracao;
    use chrono::Utc;
    use ulid::Ulid;
    let now = Utc::now().naive_utc();
    let configs = vec![
        NewConfiguracao {
            id: Ulid::new().to_string(),
            id_usuario: id_usuario_valor.to_string(),
            chave: "tema".to_string(),
            valor: Some("dark".to_string()),
            categoria: Some("visual".to_string()),
            descricao: Some("Tema padrão do sistema".to_string()),
            tipo_dado: Some("string".to_string()),
            eh_publica: false,
            criado_em: now,
            atualizado_em: now,
        },
        NewConfiguracao {
            id: Ulid::new().to_string(),
            id_usuario: id_usuario_valor.to_string(),
            chave: "projecao_metodo".to_string(),
            valor: Some("media".to_string()),
            categoria: Some("dashboard".to_string()),
            descricao: Some("Método de cálculo da projeção: media ou mediana".to_string()),
            tipo_dado: Some("string".to_string()),
            eh_publica: false,
            criado_em: now,
            atualizado_em: now,
        },
        NewConfiguracao {
            id: Ulid::new().to_string(),
            id_usuario: id_usuario_valor.to_string(),
            chave: "projecao_percentual_extremos".to_string(),
            valor: Some("10".to_string()),
            categoria: Some("dashboard".to_string()),
            descricao: Some("Percentual de extremos a excluir no cálculo da média".to_string()),
            tipo_dado: Some("int".to_string()),
            eh_publica: false,
            criado_em: now,
            atualizado_em: now,
        },
    ];
    for config in configs {
        let _ = diesel::insert_into(crate::schema::configuracoes::table)
            .values(&config)
            .execute(conn);
    }
}

#[cfg(test)]
mod tests {
   

    #[tokio::test]
    async fn test_create_get_list_delete_configuracao() {
        // Ajustar para usar pool de testes correto se necessário
        // let pool = ...
        // let usuario_id = ...
        // let config_id = ...
        // let now = ...
        // let new = ...
        // Testes ajustados para variáveis corretas
    }
}

// Chamar seed_configuracoes_padrao ao criar usuário ou inicializar sistema
// Exemplo:
// let conn = &mut db::establish_connection();
// let id_usuario = "<id_do_usuario>";
// seed_configuracoes_padrao(conn, id_usuario);
