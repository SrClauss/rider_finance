use diesel::prelude::*;
use crate::models::configuracao::NewConfiguracao;
use chrono::Utc;
use ulid::Ulid;

pub fn seed_configuracoes_padrao(conn: &mut PgConnection, id_usuario: &str) {
    let now = Utc::now().naive_utc();
    let configs = vec![
        NewConfiguracao {
            id: Ulid::new().to_string(),
            id_usuario: id_usuario.to_string(),
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
            id_usuario: id_usuario.to_string(),
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
            id_usuario: id_usuario.to_string(),
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
