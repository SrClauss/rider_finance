#[cfg(test)]
mod tests {
    use super::*;

    use tokio;

    #[tokio::test]
    async fn test_criar_checkout_asaas_mock() {
        use mockito::{mock, Matcher};

        let _mock = mock("POST", "/")
            .match_header("content-type", "application/json")
            .match_header("access_token", Matcher::Any)
            .with_status(200)
            .with_body(r#"{"id":"123","paymentUrl":"https://mocked-payment-url.com"}"#)
            .create();

        std::env::set_var("END_POINT_ASSAS", &mockito::server_url());
        std::env::set_var("ASAAS_API_KEY", "fake-key");
        std::env::set_var("PIX_ENABLED", "false");

        let payload = CheckoutPayload {
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

        let result = criar_checkout_asaas(payload).await;
        println!("Resultado do teste criar_checkout_asaas_mock: {:?}", result);
        assert!(result.is_ok());
        let resp = result.unwrap();
        assert_eq!(resp.status, "ok");
        assert_eq!(resp.id.unwrap(), "123");
        assert!(resp.link.is_none());
        assert_eq!(resp.payment_url.unwrap(), "https://mocked-payment-url.com");
    }
}
use std::env;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use hyper::http::HeaderValue;


#[derive(Serialize, Deserialize, Debug)]
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

#[derive(Serialize, Deserialize, Debug)]
pub struct CheckoutResponse {
    pub status: String,
    pub id: Option<String>,
    pub link: Option<String>,
    pub payment_url: Option<String>,
    pub mensagem: Option<String>,
}

pub async fn criar_checkout_asaas(payload: CheckoutPayload) -> Result<CheckoutResponse, String> {

    let url = env::var("END_POINT_ASSAS").map_err(|_| "END_POINT_ASSAS não configurado".to_string())?;
    let api_key = format!("${}", env::var("ASAAS_API_KEY").map_err(|_| "ASAAS_API_KEY não configurada".to_string())?);
   


    let client = Client::new();
    let body = serde_json::json!({
        // Controle do PIX via variável de ambiente
        // Se PIX_ENABLED=true, habilita PIX
        "billingTypes": if env::var("PIX_ENABLED").unwrap_or_else(|_| "false".to_string()) == "true" {
            vec!["CREDIT_CARD", "PIX"]
        } else {
            vec!["CREDIT_CARD"]
        },
        "chargeTypes": ["DETACHED"],
        "minutesToExpire": 60,
        "callback": {
            //TODO: COLOCAR AS URLS REAIS 
            //"cancelUrl": cancel_url,
            //"expiredUrl": expired_url,
            //"successUrl": success_url

            "cancelUrl": "https://www.meusite.com/cancelado",
            "expiredUrl": "https://www.meusite.com/expirado",
            "successUrl": "https://www.meusite.com/sucesso"
        },
        "items": [{
            "name": "Assinatura Rider Finance",
            "description": "Acesso completo à plataforma",
            "quantity": 1,
            "value": payload.valor
        }],
        "customerData": {
            "name": payload.nome,
            "cpfCnpj": "10700418741",
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
    .header("access_token", HeaderValue::from_str(&api_key).unwrap())
    .json(&body)
    .send()
        .await
        .map_err(|e| format!("Erro ao enviar para Asaas: {}", e))?;
    let status = res.status();
    let resp_body: serde_json::Value = res.json().await.map_err(|e| format!("Erro ao ler resposta Asaas: {}", e))?;
    let payment_url = resp_body.get("paymentUrl").and_then(|v| v.as_str()).map(|s| s.to_string());
    if status.is_success() {
        //println!("Resposta Asaas: {}", serde_json::to_string_pretty(&resp_body).unwrap());
        Ok(CheckoutResponse {
            status: "ok".to_string(),
            link: resp_body.get("link").and_then(|v| v.as_str()).map(|s| s.to_string()),
            id: resp_body.get("id").and_then(|v| v.as_str()).map(|s| s.to_string()),
            payment_url,
            mensagem: None,
        })
    } else {
        // Captura erros detalhados
        //println!("Erro Asaas: {}", serde_json::to_string_pretty(&resp_body).unwrap());
        //if let Some(errors) = resp_body.get("errors") {
        //    println!("Detalhes dos erros: {}", serde_json::to_string_pretty(errors).unwrap());
        //}
        Ok(CheckoutResponse {
            status: "erro".to_string(),
            link: None,
            id: None,
            payment_url,
            mensagem: resp_body.get("message").and_then(|v| v.as_str()).map(|s| s.to_string()),
        })
    }
}
