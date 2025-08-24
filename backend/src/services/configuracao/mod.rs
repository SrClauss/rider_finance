#[derive(serde::Deserialize)]
pub struct UpdateValor {
    pub valor: Option<String>,
}
#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::configuracao::{NewConfiguracao};
    use crate::db::establish_connection;
    use diesel::prelude::*;
    use axum::extract::Path;
    use axum::Json;
    use serial_test::serial;

    fn clean_db() {
        std::env::set_var("ENVIRONMENT", "tests");
        let conn = &mut establish_connection();
        diesel::delete(crate::schema::configuracoes::dsl::configuracoes).execute(conn).ok();
        diesel::delete(crate::schema::usuarios::dsl::usuarios).execute(conn).ok();
    }

    #[tokio::test]
    #[serial]
    async fn test_checkout_info_handler() {
        clean_db();
        // Seed padrão
        let conn = &mut establish_connection();
        seed_configuracoes_padrao(conn);
        let resp = checkout_info_handler().await;
        let v = resp.0;
        assert!(v.get("valor").is_some());
        assert!(v.get("url_endpoint_pagamento").is_some());
    }

    #[tokio::test]
    #[serial]
    async fn test_create_get_list_delete_configuracao() {
        clean_db();
        let conn = &mut establish_connection();
        // Cria usuário fake
        use crate::models::NewUsuario;
        use crate::schema::usuarios::dsl::*;
        let now = chrono::Utc::now().naive_utc();
        let user_id = "user_cfg".to_string();
        let new_user = NewUsuario {
            id: user_id.clone(),
            nome_usuario: "user_test".to_string(),
            email: "teste@teste.com".to_string(),
            senha: "senha123".to_string(),
            nome_completo: "Teste".to_string(),
            telefone: "11999999999".to_string(),
            veiculo: "Carro".to_string(),
            criado_em: now,
            atualizado_em: now,
            ultima_tentativa_redefinicao: now,
            address: "Rua Teste".to_string(),
            address_number: "123".to_string(),
            complement: "Apto 1".to_string(),
            postal_code: "01234567".to_string(),
            province: "Centro".to_string(),
            city: "São Paulo".to_string(),
            cpfcnpj: "12345678900".to_string(),
        };
        diesel::insert_into(usuarios).values(&new_user).execute(conn).ok();
        // Cria configuração
        let new = NewConfiguracao {
            id: ulid::Ulid::new().to_string(),
            id_usuario: Some(user_id.clone()),
            chave: "chave_teste".to_string(),
            valor: Some("valor_teste".to_string()),
            categoria: Some("cat".to_string()),
            descricao: Some("desc".to_string()),
            tipo_dado: Some("string".to_string()),
            eh_publica: false,
            criado_em: chrono::Utc::now().naive_utc(),
            atualizado_em: chrono::Utc::now().naive_utc(),
        };
        let result = create_configuracao_handler(Json(new.clone()), conn).await;
        assert!(result.is_ok());
        let Json(cfg) = result.unwrap();
        assert_eq!(cfg.chave, "chave_teste");
        // Get
        let result = get_configuracao_handler(Path(cfg.id.clone()), conn).await;
        assert!(result.is_ok());
        let Json(cfg2) = result.unwrap();
        assert_eq!(cfg2.chave, "chave_teste");
        // List
        let result = list_configuracoes_handler(Path(user_id.clone()), conn).await;
        assert!(result.is_ok());
        let Json(list) = result.unwrap();
        assert_eq!(list.len(), 1);
        // Delete
        let result = delete_configuracao_handler(Path(cfg.id.clone()), conn).await;
        assert!(result.is_ok());
        let Json(count) = result.unwrap();
        assert_eq!(count, 1);
    }

    #[tokio::test]
    #[serial]
    async fn test_usuario_completo_handler() {
        clean_db();
        // Cria usuário fake
        use crate::models::NewUsuario;
        use crate::schema::usuarios::dsl::*;
        let conn = &mut establish_connection();
        let now = chrono::Utc::now().naive_utc();
        let user_id = ulid::Ulid::new().to_string();
        let new_user = NewUsuario {
            id: user_id.clone(),
            nome_usuario: "user_test".to_string(),
            email: "teste@teste.com".to_string(),
            senha: "senha123".to_string(),
            nome_completo: "Teste".to_string(),
            telefone: "11999999999".to_string(),
            veiculo: "Carro".to_string(),
            criado_em: now,
            atualizado_em: now,
            ultima_tentativa_redefinicao: now,
            address: "Rua Teste".to_string(),
            address_number: "123".to_string(),
            complement: "Apto 1".to_string(),
            postal_code: "01234567".to_string(),
            province: "Centro".to_string(),
            city: "São Paulo".to_string(),
            cpfcnpj: "12345678900".to_string(),
        };
        diesel::insert_into(usuarios).values(&new_user).execute(conn).ok();
        let resp = usuario_completo_handler(Path(user_id.clone())).await;
        assert!(resp.0.is_some());
        assert_eq!(resp.0.unwrap().id, user_id);
    }
}
// Novo endpoint para buscar o objeto completo do usuário
use axum::{extract::Path, response::Json as AxumJson};
#[axum::debug_handler]
pub async fn usuario_completo_handler(Path(user_id): Path<String>) -> AxumJson<Option<crate::models::usuario::Usuario>> {
    use crate::db::establish_connection;
    use crate::schema::usuarios::dsl as usuarios_dsl;
    use crate::models::usuario::Usuario;
    let mut conn = establish_connection();
    let usuario = usuarios_dsl::usuarios
        .filter(usuarios_dsl::id.eq(&user_id))
        .first::<Usuario>(&mut conn)
        .ok();
    AxumJson(usuario)
}
// Handler para buscar valor_assinatura global
use axum::Json;
use serde_json::json;
use crate::db::establish_connection;



pub async fn checkout_info_handler() -> AxumJson<serde_json::Value> {
    use crate::schema::configuracoes::dsl::*;
    use crate::models::configuracao::Configuracao;
    let mut conn = establish_connection();
    // Busca valor da assinatura
    let result_valor = configuracoes
        .filter(id_usuario.is_null())
        .filter(chave.eq("valor_assinatura"))
        .first::<Configuracao>(&mut conn)
        .ok();
    let valor_str = result_valor.and_then(|c| c.valor).unwrap_or_else(|| "2.00".to_string());
    // Busca url do gateway de pagamento
    let result_gateway = configuracoes
        .filter(id_usuario.is_null())
        .filter(chave.eq("url_endpoint_pagamento"))
        .first::<Configuracao>(&mut conn)
        .ok();
    let url_gateway = result_gateway.and_then(|c| c.valor).unwrap_or_else(|| "https://api-sandbox.asaas.com/".to_string());
    // Busca URLs do checkout
    let cancel_url = configuracoes
        .filter(id_usuario.is_null())
        .filter(chave.eq("checkout_cancel_url"))
        .first::<Configuracao>(&mut conn)
        .ok()
        .and_then(|c| c.valor)
        .unwrap_or_else(|| "http://localhost/checkout-cancelado".to_string());
    let expired_url = configuracoes
        .filter(id_usuario.is_null())
        .filter(chave.eq("checkout_expired_url"))
        .first::<Configuracao>(&mut conn)
        .ok()
        .and_then(|c| c.valor)
        .unwrap_or_else(|| "http://localhost/checkout-expirado".to_string());
    let success_url = configuracoes
        .filter(id_usuario.is_null())
        .filter(chave.eq("checkout_success_url"))
        .first::<Configuracao>(&mut conn)
        .ok()
        .and_then(|c| c.valor)
        .unwrap_or_else(|| "http://localhost/checkout-sucesso".to_string());
    AxumJson(json!({
        "valor": valor_str,
        "url_endpoint_pagamento": url_gateway,
        "checkout_cancel_url": cancel_url,
        "checkout_expired_url": expired_url,
        "checkout_success_url": success_url
    }))
}
use ulid::Ulid;


// Removido import duplicado de Path e Json
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
    // Prevent creating configuration with the reserved seed ULID or creating a global valor_assinatura
    let reserved_ulid = std::env::var("SEED_VALOR_ASSINATURA_ULID").unwrap_or_else(|_| "01K3E3VRQ0FAXB6XMC94ZQ9GHA".to_string());
    if new.id == reserved_ulid {
        return Err("Criação proibida: id reservado para configuração de seed".to_string());
    }
    if new.chave == "valor_assinatura" && new.id_usuario.is_none() {
        return Err("Criação proibida: já existe uma configuração global 'valor_assinatura' gerenciada pelo sistema".to_string());
    }
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



use axum::http::StatusCode;



#[axum::debug_handler]
pub async fn update_configuracao_axum(
    Path(id_valor): Path<String>,
    Json(payload): Json<UpdateValor>,
) -> Result<Json<Configuracao>, (StatusCode, String)> {
    let conn = &mut establish_connection();
    // Só atualiza o valor
    let now = Utc::now().naive_utc();
    use crate::models::configuracao::ConfiguracaoChangeset;
    let changeset = ConfiguracaoChangeset {
        valor: payload.valor,
        categoria: None,
        descricao: None,
        tipo_dado: None,
        eh_publica: None,
        atualizado_em: Some(now),
    };
    diesel::update(configuracoes.filter(crate::schema::configuracoes::id.eq(id_valor)))
        .set(&changeset)
        .get_result(conn)
        .map(Json)
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))
}

pub fn update_configuracao_handler_inner(
    id_valor: String,
    payload: NewConfiguracao,
    conn: &mut PgConnection,
) -> Result<Json<Configuracao>, String> {
    let now = Utc::now().naive_utc();
    use crate::models::configuracao::ConfiguracaoChangeset;
    let changeset = ConfiguracaoChangeset {
        valor: payload.valor,
        categoria: payload.categoria,
        descricao: payload.descricao,
        tipo_dado: payload.tipo_dado,
        eh_publica: Some(payload.eh_publica),
        atualizado_em: Some(now),
    };
    diesel::update(configuracoes.filter(crate::schema::configuracoes::id.eq(id_valor)))
        .set(&changeset)
        .get_result(conn)
        .map(Json)
        .map_err(|e| e.to_string())
}

// Função para inserir configurações padrão no banco, incluindo valor_assinatura
pub fn seed_configuracoes_padrao(conn: &mut diesel::PgConnection) {

    use crate::models::configuracao::NewConfiguracao;
    let now = Utc::now().naive_utc();
    let valor_assinatura = std::env::var("VALOR_ASSINATURA").unwrap_or("2.00".to_string());
    let mut configs = vec![
        NewConfiguracao {
            id: Ulid::new().to_string(),
            id_usuario: None,
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
            id_usuario: None,
            chave: "projecao_metodo".to_string(),
            valor: Some("regressao_linear".to_string()),
            categoria: Some("dashboard".to_string()),
            descricao: Some("Método de cálculo da projeção: regressao_linear, media, mediana, media_movel_3, media_movel_7, media_movel_30".to_string()),
            tipo_dado: Some("string".to_string()),
            eh_publica: false,
            criado_em: now,
            atualizado_em: now,
        },
        NewConfiguracao {
            id: Ulid::new().to_string(),
            id_usuario: None,
            chave: "projecao_percentual_extremos".to_string(),
            valor: Some("10".to_string()),
            categoria: Some("dashboard".to_string()),
            descricao: Some("Percentual de extremos a excluir no cálculo da média".to_string()),
            tipo_dado: Some("int".to_string()),
            eh_publica: false,
            criado_em: now,
            atualizado_em: now,
        },
        // Adiciona a configuração padrão de máscara de moeda
        NewConfiguracao {
            id: Ulid::new().to_string(),
            id_usuario: None,
            chave: "mask_moeda".to_string(),
            valor: Some("R$ #.##0,00".to_string()),
            categoria: Some("visual".to_string()),
            descricao: Some("Máscara de moeda padrão para exibição de valores monetários".to_string()),
            tipo_dado: Some("string".to_string()),
            eh_publica: false,
            criado_em: now,
            atualizado_em: now,
        },

    ];
    // Adiciona valor_assinatura se não existir
    // Adiciona valor_assinatura se não existir
    if configuracoes
        .filter(crate::schema::configuracoes::id_usuario.is_null())
        .filter(crate::schema::configuracoes::chave.eq("valor_assinatura"))
        .first::<Configuracao>(conn)
        .is_err() {
        // Use fixed ULID from environment to make this config immutable by creation
        let reserved_ulid = std::env::var("SEED_VALOR_ASSINATURA_ULID").unwrap_or_else(|_| "01K3E3VRQ0FAXB6XMC94ZQ9GHA".to_string());
        configs.push(NewConfiguracao {
            id: reserved_ulid,
            id_usuario: None,
            chave: "valor_assinatura".to_string(),
            valor: Some(valor_assinatura.clone()),
            categoria: Some("sistema".to_string()),
            descricao: Some("Valor padrão da assinatura".to_string()),
            tipo_dado: Some("string".to_string()),
            eh_publica: false,
            criado_em: now,
            atualizado_em: now,
        });
    }
    // Adiciona url_endpoint_pagamento se não existir
    let endpoint_pagamento = std::env::var("END_POINT_ASSAS").unwrap_or_else(|_| "https://api-sandbox.asaas.com/".to_string());
    if configuracoes
        .filter(crate::schema::configuracoes::id_usuario.is_null())
        .filter(crate::schema::configuracoes::chave.eq("url_endpoint_pagamento"))
        .first::<Configuracao>(conn)
        .is_err() {
        configs.push(NewConfiguracao {
            id: Ulid::new().to_string(),
            id_usuario: None,
            chave: "url_endpoint_pagamento".to_string(),
            valor: Some(endpoint_pagamento),
            categoria: Some("sistema".to_string()),
            descricao: Some("URL do gateway de pagamento Asaas".to_string()),
            tipo_dado: Some("string".to_string()),
            eh_publica: false,
            criado_em: now,
            atualizado_em: now,
        });
    }
    let _ = diesel::insert_into(configuracoes)
        .values(&configs)
        .execute(conn);

    // Adiciona cancelUrl, expiredUrl, successUrl se não existirem
    let cancel_url = std::env::var("CHECKOUT_CANCEL_URL").unwrap_or_else(|_| "http://localhost/checkout-cancelado".to_string());
    let expired_url = std::env::var("CHECKOUT_EXPIRED_URL").unwrap_or_else(|_| "http://localhost/checkout-expirado".to_string());
    let success_url = std::env::var("CHECKOUT_SUCCESS_URL").unwrap_or_else(|_| "http://localhost/checkout-sucesso".to_string());

    if configuracoes
        .filter(crate::schema::configuracoes::id_usuario.is_null())
        .filter(crate::schema::configuracoes::chave.eq("checkout_cancel_url"))
        .first::<Configuracao>(conn)
        .is_err() {
        configs.push(NewConfiguracao {
            id: Ulid::new().to_string(),
            id_usuario: None,
            chave: "checkout_cancel_url".to_string(),
            valor: Some(cancel_url),
            categoria: Some("sistema".to_string()),
            descricao: Some("URL de cancelamento do checkout".to_string()),
            tipo_dado: Some("string".to_string()),
            eh_publica: false,
            criado_em: now,
            atualizado_em: now,
        });
    }
    if configuracoes
        .filter(crate::schema::configuracoes::id_usuario.is_null())
        .filter(crate::schema::configuracoes::chave.eq("checkout_expired_url"))
        .first::<Configuracao>(conn)
        .is_err() {
        configs.push(NewConfiguracao {
            id: Ulid::new().to_string(),
            id_usuario: None,
            chave: "checkout_expired_url".to_string(),
            valor: Some(expired_url),
            categoria: Some("sistema".to_string()),
            descricao: Some("URL de expiração do checkout".to_string()),
            tipo_dado: Some("string".to_string()),
            eh_publica: false,
            criado_em: now,
            atualizado_em: now,
        });
    }
    if configuracoes
        .filter(crate::schema::configuracoes::id_usuario.is_null())
        .filter(crate::schema::configuracoes::chave.eq("checkout_success_url"))
        .first::<Configuracao>(conn)
        .is_err() {
        configs.push(NewConfiguracao {
            id: Ulid::new().to_string(),
            id_usuario: None,
            chave: "checkout_success_url".to_string(),
            valor: Some(success_url),
            categoria: Some("sistema".to_string()),
            descricao: Some("URL de sucesso do checkout".to_string()),
            tipo_dado: Some("string".to_string()),
            eh_publica: false,
            criado_em: now,
            atualizado_em: now,
        });
    }

    // Adiciona cancelUrl, expiredUrl, successUrl se não existirem
    let cancel_url = std::env::var("CHECKOUT_CANCEL_URL").unwrap_or_else(|_| "http://localhost:3000/checkout-cancelado".to_string());
    let expired_url = std::env::var("CHECKOUT_EXPIRED_URL").unwrap_or_else(|_| "http://localhost:3000/checkout-expirado".to_string());
    let success_url = std::env::var("CHECKOUT_SUCCESS_URL").unwrap_or_else(|_| "http://localhost:3000/checkout-sucesso".to_string());

    if configuracoes
        .filter(crate::schema::configuracoes::id_usuario.is_null())
        .filter(crate::schema::configuracoes::chave.eq("checkout_cancel_url"))
        .first::<Configuracao>(conn)
        .is_err() {
        configs.push(NewConfiguracao {
            id: Ulid::new().to_string(),
            id_usuario: None,
            chave: "checkout_cancel_url".to_string(),
            valor: Some(cancel_url),
            categoria: Some("sistema".to_string()),
            descricao: Some("URL de cancelamento do checkout".to_string()),
            tipo_dado: Some("string".to_string()),
            eh_publica: false,
            criado_em: now,
            atualizado_em: now,
        });
    }
    if configuracoes
        .filter(crate::schema::configuracoes::id_usuario.is_null())
        .filter(crate::schema::configuracoes::chave.eq("checkout_expired_url"))
        .first::<Configuracao>(conn)
        .is_err() {
        configs.push(NewConfiguracao {
            id: Ulid::new().to_string(),
            id_usuario: None,
            chave: "checkout_expired_url".to_string(),
            valor: Some(expired_url),
            categoria: Some("sistema".to_string()),
            descricao: Some("URL de expiração do checkout".to_string()),
            tipo_dado: Some("string".to_string()),
            eh_publica: false,
            criado_em: now,
            atualizado_em: now,
        });
    }
    if configuracoes
        .filter(crate::schema::configuracoes::id_usuario.is_null())
        .filter(crate::schema::configuracoes::chave.eq("checkout_success_url"))
        .first::<Configuracao>(conn)
        .is_err() {
        configs.push(NewConfiguracao {
            id: Ulid::new().to_string(),
            id_usuario: None,
            chave: "checkout_success_url".to_string(),
            valor: Some(success_url),
            categoria: Some("sistema".to_string()),
            descricao: Some("URL de sucesso do checkout".to_string()),
            tipo_dado: Some("string".to_string()),
            eh_publica: false,
            criado_em: now,
            atualizado_em: now,
        });
    }
}

