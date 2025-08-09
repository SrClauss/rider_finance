use crate::db;
use crate::models::configuracao::Configuracao;
use crate::schema::configuracoes::dsl::*;
use diesel::prelude::*;

fn buscar_valor_assinatura() -> String {
    let conn = &mut db::establish_connection();
    let id_default = "sistema";
    match configuracoes
        .filter(id_usuario.eq(id_default))
        .filter(chave.eq("valor_assinatura"))
        .first::<Configuracao>(conn)
    {
        Ok(config) => config.valor.unwrap_or_else(|| std::env::var("VALOR_ASSINATURA").unwrap_or("2.00".to_string())),
        Err(_) => std::env::var("VALOR_ASSINATURA").unwrap_or("2.00".to_string()),
    }
}
use std::env;
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct AsaasClientePayload {
    pub id_usuario: String,
    // Adicione outros campos obrigatórios do Asaas aqui
}

#[derive(Serialize, Deserialize)]
pub struct AsaasResponse {
    pub status: String,
    pub id: Option<String>,
    pub valor_assinatura: Option<String>,
    pub payment_url: Option<String>,
    pub mensagem: Option<String>,
}

pub async fn criar_cliente_asaas(usuario_id: String) -> Result<AsaasResponse, String> {
    let url = env::var("END_POINT_ASSAS").map_err(|_| "END_POINT_ASSAS não configurado".to_string())?;
    let api_key = env::var("ASAAS_API_KEY").map_err(|_| "ASAAS_API_KEY não configurada".to_string())?;
    let valor_assinatura = buscar_valor_assinatura();
    let client = Client::new();
    let payload = AsaasClientePayload { id_usuario: usuario_id.clone() };
    let res = client.post(url)
        .header("Content-Type", "application/json")
        .header("access_token", api_key)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Erro ao enviar para Asaas: {}", e))?;
    let status = res.status();
    let body: serde_json::Value = res.json().await.map_err(|e| format!("Erro ao ler resposta Asaas: {}", e))?;
    let payment_url = body.get("bankSlipUrl")
        .or_else(|| body.get("invoiceUrl"))
        .or_else(|| body.get("paymentUrl"))
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());
    if status.is_success() {
        Ok(AsaasResponse {
            status: "ok".to_string(),
            id: body.get("id").and_then(|v| v.as_str()).map(|s| s.to_string()),
            valor_assinatura: Some(valor_assinatura),
            payment_url,
            mensagem: None,
        })
    } else {
        Ok(AsaasResponse {
            status: "erro".to_string(),
            id: None,
            valor_assinatura: Some(valor_assinatura),
            payment_url,
            mensagem: body.get("message").and_then(|v| v.as_str()).map(|s| s.to_string()),
        })
    }
}
