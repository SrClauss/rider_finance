use std::env;
use diesel::prelude::*;
use diesel::QueryDsl;
use diesel::ExpressionMethods;
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct CheckoutPayload {
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

#[derive(Serialize, Deserialize)]
pub struct CheckoutResponse {
    pub status: String,
    pub id: Option<String>,
    pub payment_url: Option<String>,
    pub mensagem: Option<String>,
}

pub async fn criar_checkout_asaas(payload: CheckoutPayload) -> Result<CheckoutResponse, String> {
    use crate::db::establish_connection;
    use crate::schema::configuracoes::dsl::*;
    use crate::models::configuracao::Configuracao;
    let url = env::var("END_POINT_ASSAS").map_err(|_| "END_POINT_ASSAS não configurado".to_string())?;
    let api_key = env::var("ASAAS_API_KEY").map_err(|_| "ASAAS_API_KEY não configurada".to_string())?;
    let mut conn = establish_connection();
    // Buscar URLs do banco
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
    let client = Client::new();
    let body = serde_json::json!({
        "billingTypes": ["CREDIT_CARD", "PIX"],
        "chargeTypes": ["DETACHED"],
        "minutesToExpire": 60,
        "callback": {
            "cancelUrl": cancel_url,
            "expiredUrl": expired_url,
            "successUrl": success_url
        },
        "items": [{
            "name": "Assinatura Rider Finance",
            "description": "Acesso completo à plataforma",
            "quantity": 1,
            "value": payload.valor
        }],
        "customerData": {
            "name": payload.nome,
            "cpfCnpj": payload.cpf,
            "email": payload.email,
            "phone": payload.telefone,
            "address": payload.endereco,
            "addressNumber": payload.numero,
            "complement": payload.complemento,
            "postalCode": payload.cep,
            "province": payload.bairro,
            "city": payload.cidade
        }
    });
    let res = client.post(url)
        .header("Content-Type", "application/json")
        .header("User-Agent", "RiderFinanceBackend")
        .header("access_token", api_key)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Erro ao enviar para Asaas: {}", e))?;
    let status = res.status();
    let resp_body: serde_json::Value = res.json().await.map_err(|e| format!("Erro ao ler resposta Asaas: {}", e))?;
    let payment_url = resp_body.get("paymentUrl").and_then(|v| v.as_str()).map(|s| s.to_string());
    if status.is_success() {
        Ok(CheckoutResponse {
            status: "ok".to_string(),
            id: resp_body.get("id").and_then(|v| v.as_str()).map(|s| s.to_string()),
            payment_url,
            mensagem: None,
        })
    } else {
        Ok(CheckoutResponse {
            status: "erro".to_string(),
            id: None,
            payment_url,
            mensagem: resp_body.get("message").and_then(|v| v.as_str()).map(|s| s.to_string()),
        })
    }
}
