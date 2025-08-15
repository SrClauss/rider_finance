#[cfg(test)]
mod tests {
    use mockito::{mock, Matcher};
    use tokio;
    use serial_test::serial;

    // use serial_test::serial;
    #[tokio::test]
    #[serial]
    async fn test_criar_cliente_asaas_mock() {
        // Configura mock do endpoint
        let mock = mock("POST", "/")
            .match_header("content-type", "application/json")
            .match_header("access_token", Matcher::Any)
            .with_status(200)
            .with_body(r#"{"id":"123","paymentUrl":"https://mocked-payment-url.com"}"#)
            .expect(1)
            .create();

        use diesel::prelude::*;
        use crate::schema::configuracoes::dsl::*;
        // Limpa antes
        let conn = &mut crate::db::establish_connection();
        diesel::delete(configuracoes.filter(id_usuario.eq("sistema")).filter(chave.eq("valor_assinatura")))
            .execute(conn)
            .ok();

        std::env::set_var("END_POINT_ASSAS", &mockito::server_url());
        std::env::set_var("ASAAS_API_KEY", "fake-key");
        std::env::set_var("VALOR_ASSINATURA", "10.00");

        let result = criar_cliente_asaas("user_test".to_string()).await;
        mock.assert();
        println!("Resultado do teste criar_cliente_asaas_mock: {:?}", result);
        assert!(result.is_ok());
        let resp = result.unwrap();
        assert_eq!(resp.status, "ok");
        assert_eq!(resp.id.unwrap(), "123");

        // Limpa depois
        diesel::delete(configuracoes.filter(id_usuario.eq("sistema")).filter(chave.eq("valor_assinatura")))
            .execute(conn)
            .ok();
    }
    use super::*;
    use std::env;

    // use serial_test::serial;
    #[test]
    #[serial]
    fn test_buscar_valor_assinatura_default_env() {
        use diesel::prelude::*;
        use crate::schema::configuracoes::dsl::*;
             // Limpa antes
        let conn = &mut crate::db::establish_connection();
        diesel::delete(configuracoes.filter(id_usuario.eq("sistema")).filter(chave.eq("valor_assinatura")))
            .execute(conn)
            .ok();

        // Setar variável de ambiente após limpeza
        env::set_var("VALOR_ASSINATURA", "9.99");

        // Garante que não há registro após possíveis execuções anteriores
        assert_eq!(
            configuracoes
                .filter(id_usuario.eq("sistema")).filter(chave.eq("valor_assinatura"))
                .first::<crate::models::configuracao::Configuracao>(conn)
                .err()
                .is_some(),
            true
        );

        let valor_assinatura = buscar_valor_assinatura();
        assert_eq!(valor_assinatura, "9.99");

        // Limpa depois
        diesel::delete(configuracoes.filter(id_usuario.eq("sistema")).filter(chave.eq("valor_assinatura")))
            .execute(conn)
            .ok();

        env::set_var("VALOR_ASSINATURA", "9.99");
        let valor_assinatura = buscar_valor_assinatura();
        // O valor deve ser o da variável de ambiente se não houver registro no banco
        assert_eq!(valor_assinatura, "9.99");
    }
}
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

#[derive(Serialize, Deserialize, Debug)]
pub struct AsaasClientePayload {
    pub id_usuario: String,
    // Adicione outros campos obrigatórios do Asaas aqui
}

#[derive(Serialize, Deserialize, Debug)]
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
