pub mod asaas;
mod checkout;

// ...existing code...
use crate::services::assinatura::asaas::criar_cliente_asaas;

#[derive(Deserialize)]
pub struct CriarClientePayload {
    pub id_usuario: String,
}

pub async fn criar_cliente_handler(Json(payload): Json<CriarClientePayload>) -> Json<crate::services::assinatura::asaas::AsaasResponse> {
    match criar_cliente_asaas(payload.id_usuario).await {
        Ok(resp) => Json(resp),
        Err(e) => Json(crate::services::assinatura::asaas::AsaasResponse {
            status: "erro".to_string(),
            id: None,
            valor_assinatura: None,
            payment_url: None,
            mensagem: Some(e),
        }),
    }
}
use axum::Json;
use crate::services::assinatura::checkout::{criar_checkout_asaas, CheckoutPayload, CheckoutResponse};

#[derive(Deserialize)]
pub struct CriarCheckoutPayload {
    pub id_usuario: String,
    pub valor: String,
    pub nome: String,
    pub cpf: String,
    pub email: String,
    pub telefone: String,
    pub endereco: String,
    pub numero: String,
    pub complemento: String,
    pub cep: String,
    pub bairro: String,
    pub cidade: String,
}

pub async fn criar_checkout_handler(Json(payload): Json<CriarCheckoutPayload>) -> Json<CheckoutResponse> {
    let checkout_payload = CheckoutPayload {
        id_usuario: payload.id_usuario,
        valor: payload.valor,
        nome: payload.nome,
        cpf: payload.cpf,
        email: payload.email,
        telefone: payload.telefone,
        endereco: payload.endereco,
        numero: payload.numero,
        complemento: payload.complemento,
        cep: payload.cep,
        bairro: payload.bairro,
        cidade: payload.cidade,
    };
    match criar_checkout_asaas(checkout_payload).await {
        Ok(resp) => Json(resp),
        Err(e) => Json(CheckoutResponse {
            status: "erro".to_string(),
            link: None,
            id: None,
            payment_url: None,
            mensagem: Some(e),
        }),
    }
}
use axum::{ extract::Path};
use diesel::prelude::*;
use serde::{Serialize, Deserialize};
use chrono::NaiveDateTime;
use crate::db;
use crate::schema::assinaturas::dsl::*;
use crate::models::{Assinatura, NewAssinatura};

#[derive(Deserialize)]
pub struct CreateAssinaturaPayload {
    pub id_usuario: String,
    pub tipo_plano: String,
    pub status: String,
    pub asaas_customer_id: String,
    pub asaas_subscription_id: Option<String>,
    pub periodo_inicio: NaiveDateTime,
    pub periodo_fim: NaiveDateTime,
    pub cancelada_em: Option<NaiveDateTime>,
}

#[derive(Serialize)]
pub struct AssinaturaResponse {
    pub id: String,
    pub id_usuario: String,
    pub tipo_plano: String,
    pub status: String,
    pub asaas_customer_id: String,
    pub asaas_subscription_id: Option<String>,
    pub periodo_inicio: NaiveDateTime,
    pub periodo_fim: NaiveDateTime,
    pub cancelada_em: Option<NaiveDateTime>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}

pub async fn create_assinatura_handler(Json(payload): Json<CreateAssinaturaPayload>) -> Json<AssinaturaResponse> {
    let conn = &mut db::establish_connection();
    let now = chrono::Utc::now().naive_utc();
    let nova_assinatura = NewAssinatura {
        id: ulid::Ulid::new().to_string(),
        id_usuario: payload.id_usuario,
        tipo_plano: payload.tipo_plano,
        status: payload.status,
        asaas_customer_id: payload.asaas_customer_id,
        asaas_subscription_id: payload.asaas_subscription_id,
        periodo_inicio: payload.periodo_inicio,
        periodo_fim: payload.periodo_fim,
        cancelada_em: payload.cancelada_em,
        criado_em: now,
        atualizado_em: now,
    };
    diesel::insert_into(assinaturas)
        .values(&nova_assinatura)
        .execute(conn)
        .expect("Erro ao inserir assinatura");
    Json(AssinaturaResponse {
        id: nova_assinatura.id,
        id_usuario: nova_assinatura.id_usuario,
        tipo_plano: nova_assinatura.tipo_plano,
        status: nova_assinatura.status,
        asaas_customer_id: nova_assinatura.asaas_customer_id,
        asaas_subscription_id: nova_assinatura.asaas_subscription_id,
        periodo_inicio: nova_assinatura.periodo_inicio,
        periodo_fim: nova_assinatura.periodo_fim,
        cancelada_em: nova_assinatura.cancelada_em,
        criado_em: nova_assinatura.criado_em,
        atualizado_em: nova_assinatura.atualizado_em,
    })
}

pub async fn get_assinatura_handler(Path(id_param): Path<String>) -> Json<Option<AssinaturaResponse>> {
    let conn = &mut db::establish_connection();
    match assinaturas.filter(id.eq(id_param)).first::<Assinatura>(conn) {
        Ok(a) => Json(Some(AssinaturaResponse {
            id: a.id,
            id_usuario: a.id_usuario,
            tipo_plano: a.tipo_plano,
            status: a.status,
            asaas_customer_id: a.asaas_customer_id,
            asaas_subscription_id: a.asaas_subscription_id,
            periodo_inicio: a.periodo_inicio,
            periodo_fim: a.periodo_fim,
            cancelada_em: a.cancelada_em,
            criado_em: a.criado_em,
            atualizado_em: a.atualizado_em,
        })),
        Err(_) => Json(None),
    }
}

pub async fn list_assinaturas_handler(Path(id_usuario_param): Path<String>) -> Json<Vec<AssinaturaResponse>> {
    let conn = &mut db::establish_connection();
    let results = assinaturas
        .filter(id_usuario.eq(id_usuario_param))
        .order(periodo_inicio.desc())
        .load::<Assinatura>(conn)
        .unwrap_or_default();
    Json(results.into_iter().map(|a| AssinaturaResponse {
        id: a.id,
        id_usuario: a.id_usuario,
        tipo_plano: a.tipo_plano,
        status: a.status,
        asaas_customer_id: a.asaas_customer_id,
        asaas_subscription_id: a.asaas_subscription_id,
        periodo_inicio: a.periodo_inicio,
        periodo_fim: a.periodo_fim,
        cancelada_em: a.cancelada_em,
        criado_em: a.criado_em,
        atualizado_em: a.atualizado_em,
    }).collect())
}

pub async fn delete_assinatura_handler(Path(id_param): Path<String>) -> Json<bool> {
    let conn = &mut db::establish_connection();
    let count = diesel::delete(assinaturas.filter(id.eq(id_param))).execute(conn).unwrap_or(0);
    Json(count > 0)
}

#[derive(Deserialize, Debug)]
pub struct AsaasWebhookPayload {
    pub event: String,
    pub payment: Option<serde_json::Value>,
    pub subscription: Option<serde_json::Value>,
    pub customer: Option<serde_json::Value>,
    // Adicione outros campos conforme necessário
}

pub async fn asaas_webhook_handler(Json(payload): Json<AsaasWebhookPayload>) -> Json<String> {
    // Exemplo: processar evento de pagamento
    match payload.event.as_str() {
        "PAYMENT_RECEIVED" => {
            // Aqui você pode atualizar status da assinatura, gerar notificação, etc.
            // Exemplo: buscar id_usuario pelo payment ou subscription e atualizar
            // TODO: implementar lógica completa conforme doc Asaas
            Json("Pagamento recebido e processado".to_string())
        },
        "SUBSCRIPTION_CREATED" => {
            // Lógica para assinatura criada
            Json("Assinatura criada".to_string())
        },
        _ => Json(format!("Evento não tratado: {}", payload.event)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::Json;
    use ulid::Ulid;
    use chrono::Utc;

    use diesel_migrations::{embed_migrations, MigrationHarness};
    pub const MIGRATIONS: diesel_migrations::EmbeddedMigrations = embed_migrations!("migrations");

    #[tokio::test]
    async fn test_create_get_list_delete_assinatura() {
        let conn = &mut db::establish_connection_test();
        conn.run_pending_migrations(MIGRATIONS).expect("Falha ao rodar migrações no banco de testes");
        diesel::sql_query("PRAGMA foreign_keys = OFF;").execute(conn).ok();
        diesel::sql_query("DELETE FROM assinaturas;").execute(conn).ok();
        diesel::sql_query("DELETE FROM usuarios;").execute(conn).ok();
        diesel::sql_query("PRAGMA foreign_keys = ON;").execute(conn).ok();

        let user_id = Ulid::new().to_string();
        let usuario = crate::models::NewUsuario::new(
            Some(user_id.clone()),
            format!("testuser_{}", user_id),
            format!("{}@test.com", user_id),
            "senha123".to_string(),
            None, None, None, None, false, None, None, Some("ativo".to_string()), Some("free".to_string()), None, None, None,
            "Rua Teste".to_string(), "123".to_string(), "Apto 1".to_string(), "12345-678".to_string(), "SP".to_string(), "São Paulo".to_string(), None
        );
        crate::services::auth::register::register_user_test(usuario).expect("Erro ao criar usuário de teste");

        let payload = CreateAssinaturaPayload {
            id_usuario: user_id.clone(),
            tipo_plano: "premium".to_string(),
            status: "ativa".to_string(),
            asaas_customer_id: "asaas_123".to_string(),
            asaas_subscription_id: None,
            periodo_inicio: Utc::now().naive_utc(),
            periodo_fim: Utc::now().naive_utc() + chrono::Duration::days(30),
            cancelada_em: None,
        };
        let response = create_assinatura_handler(Json(payload)).await;
        assert_eq!(response.id_usuario, user_id);
        assert_eq!(response.tipo_plano, "premium");
        // Busca por id
        let get_resp = get_assinatura_handler(Path(response.id.clone())).await;
        assert!(get_resp.0.is_some());
        let a = get_resp.0.unwrap();
        assert_eq!(a.id, response.id);
        assert_eq!(a.tipo_plano, "premium");
        // Lista
        let list_resp = list_assinaturas_handler(Path(user_id.clone())).await;
        assert!(list_resp.0.iter().any(|aa| aa.id == a.id));
        // Delete
        let del_resp = delete_assinatura_handler(Path(a.id.clone())).await;
        assert!(del_resp.0);
        let get_resp2 = get_assinatura_handler(Path(a.id.clone())).await;
        assert!(get_resp2.0.is_none());
    }
}
