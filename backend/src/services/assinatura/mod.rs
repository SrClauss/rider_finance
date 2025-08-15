#[cfg(test)]
mod tests {
    use super::*;
    use axum::Json;
    use std::env;
    use mockito::{mock, Matcher};
    use tokio;

    #[tokio::test]
    async fn test_criar_cliente_handler_mock() {
        let _mock = mock("POST", "/")
            .match_header("content-type", "application/json")
            .match_header("access_token", Matcher::Any)
            .with_status(200)
            .with_body(r#"{"id":"123","paymentUrl":"https://mocked-payment-url.com"}"#)
            .create();
        env::set_var("END_POINT_ASSAS", &mockito::server_url());
        env::set_var("ASAAS_API_KEY", "fake-key");
        env::set_var("VALOR_ASSINATURA", "10.00");
        let payload = CriarClientePayload { id_usuario: "user_test".to_string() };
        let resp = criar_cliente_handler(Json(payload)).await;
        let r = resp.0;
        assert_eq!(r.status, "ok");
        assert_eq!(r.id.unwrap(), "123");
        assert_eq!(r.payment_url.unwrap(), "https://mocked-payment-url.com");
    }

    #[tokio::test]
    async fn test_criar_checkout_handler_mock() {
        let _mock = mock("POST", "/")
            .match_header("content-type", "application/json")
            .match_header("access_token", Matcher::Any)
            .with_status(200)
            .with_body(r#"{"id":"abc123","link":"https://mocked-link.com","paymentUrl":"https://mocked-payment-url.com"}"#)
            .create();
        env::set_var("END_POINT_ASSAS", &mockito::server_url());
        env::set_var("ASAAS_API_KEY", "fake-key");
        env::set_var("PIX_ENABLED", "false");
        let payload = CriarCheckoutPayload {
            id_usuario: "user_test".to_string(),
            valor: "99.99".to_string(),
            nome: "Teste".to_string(),
            cpf: "12345678900".to_string(),
            email: "teste@teste.com".to_string(),
            telefone: "11999999999".to_string(),
            endereco: "Rua Teste".to_string(),
            numero: "123".to_string(),
            complemento: "Apto 1".to_string(),
            cep: "01234567".to_string(),
            bairro: "Centro".to_string(),
            cidade: "São Paulo".to_string(),
        };
        let resp = criar_checkout_handler(Json(payload)).await;
        let r = resp.0;
        assert_eq!(r.status, "ok");
        assert_eq!(r.id.unwrap(), "abc123");
        assert_eq!(r.link.unwrap(), "https://mocked-link.com");
        assert_eq!(r.payment_url.unwrap(), "https://mocked-payment-url.com");
    }

    #[tokio::test]
    async fn test_asaas_webhook_handler() {
        let payload = AsaasWebhookPayload {
            event: "PAYMENT_RECEIVED".to_string(),
            payment: None,
            subscription: None,
            customer: None,
        };
        let resp = asaas_webhook_handler(Json(payload)).await;
        assert_eq!(resp.0, "Pagamento recebido e processado");
        let payload2 = AsaasWebhookPayload {
            event: "SUBSCRIPTION_CREATED".to_string(),
            payment: None,
            subscription: None,
            customer: None,
        };
        let resp2 = asaas_webhook_handler(Json(payload2)).await;
        assert_eq!(resp2.0, "Assinatura criada");
        let payload3 = AsaasWebhookPayload {
            event: "OUTRO_EVENTO".to_string(),
            payment: None,
            subscription: None,
            customer: None,
        };
        let resp3 = asaas_webhook_handler(Json(payload3)).await;
        assert_eq!(resp3.0, "Evento não tratado: OUTRO_EVENTO");
    }
}
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
    pub status: String,
    pub asaas_subscription_id: Option<String>,
    pub periodo_inicio: NaiveDateTime,
    pub periodo_fim: NaiveDateTime,
    pub cancelada_em: Option<NaiveDateTime>,
    pub billing_type: Option<String>,
    pub charge_type: Option<String>,
    pub webhook_event_id: Option<String>,
    pub checkout_id: Option<String>,
    pub checkout_status: Option<String>,
    pub checkout_date_created: Option<NaiveDateTime>,
    pub checkout_event_type: Option<String>,
        pub valor: Option<i32>,
    pub descricao: Option<String>,
    pub nome_cliente: Option<String>,
    pub email_cliente: Option<String>,
    pub cpf_cnpj_cliente: Option<String>,
}

#[derive(Serialize)]
pub struct AssinaturaResponse {
    pub id: String,
    pub id_usuario: String,
    pub status: String,
    pub asaas_subscription_id: Option<String>,
    pub periodo_inicio: NaiveDateTime,
    pub periodo_fim: NaiveDateTime,
    pub cancelada_em: Option<NaiveDateTime>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
    pub billing_type: Option<String>,
    pub charge_type: Option<String>,
    pub webhook_event_id: Option<String>,
    pub checkout_id: Option<String>,
    pub checkout_status: Option<String>,
    pub checkout_date_created: Option<NaiveDateTime>,
    pub checkout_event_type: Option<String>,
        pub valor: Option<i32>,
    pub descricao: Option<String>,
    pub nome_cliente: Option<String>,
    pub email_cliente: Option<String>,
    pub cpf_cnpj_cliente: Option<String>,
}

pub async fn create_assinatura_handler(Json(payload): Json<CreateAssinaturaPayload>) -> Json<AssinaturaResponse> {
    let conn = &mut db::establish_connection();
    let now = chrono::Utc::now().naive_utc();
    let nova_assinatura = NewAssinatura {
        id: ulid::Ulid::new().to_string(),
        id_usuario: payload.id_usuario,
        status: payload.status,
        asaas_subscription_id: payload.asaas_subscription_id,
        periodo_inicio: payload.periodo_inicio,
        periodo_fim: payload.periodo_fim,
        cancelada_em: payload.cancelada_em,
        criado_em: now,
        atualizado_em: now,
        billing_type: payload.billing_type,
        charge_type: payload.charge_type,
        webhook_event_id: payload.webhook_event_id,
        checkout_id: payload.checkout_id,
        checkout_status: payload.checkout_status,
        checkout_date_created: payload.checkout_date_created,
        checkout_event_type: payload.checkout_event_type,
        valor: payload.valor.map(|v| v as i32),
        descricao: payload.descricao,
        nome_cliente: payload.nome_cliente,
        email_cliente: payload.email_cliente,
        cpf_cnpj_cliente: payload.cpf_cnpj_cliente,
    };
    diesel::insert_into(assinaturas)
        .values(&nova_assinatura)
        .execute(conn)
        .expect("Erro ao inserir assinatura");
    Json(AssinaturaResponse {
        id: nova_assinatura.id,
        id_usuario: nova_assinatura.id_usuario,
        status: nova_assinatura.status,
        asaas_subscription_id: nova_assinatura.asaas_subscription_id,
        periodo_inicio: nova_assinatura.periodo_inicio,
        periodo_fim: nova_assinatura.periodo_fim,
        cancelada_em: nova_assinatura.cancelada_em,
        criado_em: nova_assinatura.criado_em,
        atualizado_em: nova_assinatura.atualizado_em,
        billing_type: nova_assinatura.billing_type,
        charge_type: nova_assinatura.charge_type,
        webhook_event_id: nova_assinatura.webhook_event_id,
        checkout_id: nova_assinatura.checkout_id,
        checkout_status: nova_assinatura.checkout_status,
        checkout_date_created: nova_assinatura.checkout_date_created,
        checkout_event_type: nova_assinatura.checkout_event_type,
        valor: nova_assinatura.valor,
        descricao: nova_assinatura.descricao,
        nome_cliente: nova_assinatura.nome_cliente,
        email_cliente: nova_assinatura.email_cliente,
        cpf_cnpj_cliente: nova_assinatura.cpf_cnpj_cliente,
    })
}

pub async fn get_assinatura_handler(Path(id_param): Path<String>) -> Json<Option<AssinaturaResponse>> {
    let conn = &mut db::establish_connection();
    match assinaturas.filter(id.eq(id_param)).first::<Assinatura>(conn) {
        Ok(a) => Json(Some(AssinaturaResponse {
            id: a.id,
            id_usuario: a.id_usuario,
            status: a.status,
            asaas_subscription_id: a.asaas_subscription_id,
            periodo_inicio: a.periodo_inicio,
            periodo_fim: a.periodo_fim,
            cancelada_em: a.cancelada_em,
            criado_em: a.criado_em,
            atualizado_em: a.atualizado_em,
            billing_type: a.billing_type,
            charge_type: a.charge_type,
            webhook_event_id: a.webhook_event_id,
            checkout_id: a.checkout_id,
            checkout_status: a.checkout_status,
            checkout_date_created: a.checkout_date_created,
            checkout_event_type: a.checkout_event_type,
            valor: a.valor,
            descricao: a.descricao,
            nome_cliente: a.nome_cliente,
            email_cliente: a.email_cliente,
            cpf_cnpj_cliente: a.cpf_cnpj_cliente,
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
        status: a.status,
        asaas_subscription_id: a.asaas_subscription_id,
        periodo_inicio: a.periodo_inicio,
        periodo_fim: a.periodo_fim,
        cancelada_em: a.cancelada_em,
        criado_em: a.criado_em,
        atualizado_em: a.atualizado_em,
        billing_type: a.billing_type,
        charge_type: a.charge_type,
        webhook_event_id: a.webhook_event_id,
        checkout_id: a.checkout_id,
        checkout_status: a.checkout_status,
        checkout_date_created: a.checkout_date_created,
        checkout_event_type: a.checkout_event_type,
        valor: a.valor,
        descricao: a.descricao,
        nome_cliente: a.nome_cliente,
        email_cliente: a.email_cliente,
        cpf_cnpj_cliente: a.cpf_cnpj_cliente,
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
pub async fn get_assinatura_by_usuario_handler(Path(id_usuario_param): Path<String>) -> Json<Vec<AssinaturaResponse>> {
    println!("Buscando assinaturas para usuário: {}", id_usuario_param);
    let conn = &mut db::establish_connection();
    let results = assinaturas
        .filter(id_usuario.eq(id_usuario_param))
        .order(periodo_inicio.desc())
        .load::<Assinatura>(conn)
        .unwrap_or_default();
    Json(results.into_iter().map(|a| AssinaturaResponse {
        id: a.id,
        id_usuario: a.id_usuario,
        status: a.status,
        asaas_subscription_id: a.asaas_subscription_id,
        periodo_inicio: a.periodo_inicio,
        periodo_fim: a.periodo_fim,
        cancelada_em: a.cancelada_em,
        criado_em: a.criado_em,
        atualizado_em: a.atualizado_em,
        billing_type: a.billing_type,
        charge_type: a.charge_type,
        webhook_event_id: a.webhook_event_id,
        checkout_id: a.checkout_id,
        checkout_status: a.checkout_status,
        checkout_date_created: a.checkout_date_created,
        checkout_event_type: a.checkout_event_type,
        valor: a.valor,
        descricao: a.descricao,
        nome_cliente: a.nome_cliente,
        email_cliente: a.email_cliente,
        cpf_cnpj_cliente: a.cpf_cnpj_cliente,
    }).collect())
}

