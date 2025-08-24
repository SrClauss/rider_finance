#[cfg(test)]
mod tests {
    use super::webhook::*;
    use axum::response::IntoResponse;
    use axum::http::{HeaderMap, StatusCode};
    use axum::extract::ConnectInfo;
    use serde_json::json;
    use std::net::{SocketAddr, IpAddr, Ipv4Addr};

    #[tokio::test]
    async fn test_webhook_ip_nao_autorizado() {
        let addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::new(1,2,3,4)), 8080);
        let headers = HeaderMap::new();
        let payload = json!({"checkout": {"customerData": {"email": "x@x.com"}}});
        let response = receber_webhook(ConnectInfo(addr), headers, axum::Json(payload)).await.into_response();
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn test_webhook_payload_invalido() {
        let addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::new(52,67,12,206)), 8080); // IP autorizado
        let headers = HeaderMap::new();
        let payload = json!({"foo": "bar"});
        let response = receber_webhook(ConnectInfo(addr), headers, axum::Json(payload)).await.into_response();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    // Teste de fluxo completo exigiria setup de usuário e assinatura no banco, pode ser implementado com mocks ou banco de teste isolado.
}
use axum::{http::StatusCode, extract::ConnectInfo};
use std::net::SocketAddr;
// use axum_extra::extract::TypedHeader;
use axum::http::HeaderMap;

pub mod webhook {
    use super::*;
    use axum::{Router, routing::post, Json};
    use axum::response::IntoResponse;
    use serde_json::Value;

    // Lista de IPs permitidos (Asaas)
    const ASAAS_IPS: &[&str] = &[
        "52.67.12.206",
        "18.230.8.159",
        "54.94.136.112",
        "54.94.183.101",
        "54.232.48.115"
    ];

    pub async fn receber_webhook(
        ConnectInfo(addr): ConnectInfo<SocketAddr>,
        headers: HeaderMap,
        Json(payload): Json<Value>
    ) -> axum::response::Response {
        // Tenta pegar o IP do header X-Forwarded-For
        let ip = if let Some(forwarded) = headers.get("x-forwarded-for") {
            forwarded.to_str().unwrap_or("").split(',').next().unwrap_or("").trim().to_string()
        } else {
            addr.ip().to_string()
        };
        if !ASAAS_IPS.contains(&ip.as_str()) {
            return (StatusCode::UNAUTHORIZED, Json("IP não autorizado".to_string())).into_response();
        }

        // --- Busca dados do cliente ---
        use crate::db;
        use crate::schema::assinaturas::dsl::{assinaturas, id as assinatura_id, atualizado_em as assinatura_atualizado_em, periodo_fim, id_usuario};
        use crate::schema::usuarios::dsl::*;
        use diesel::prelude::*;
        use chrono::{Utc, Duration};
        let conn = &mut db::establish_connection();
        let customer_data = payload.get("checkout")
            .and_then(|v| v.get("customerData"))
            .and_then(|v| v.as_object());
        if customer_data.is_none() {
            return (StatusCode::BAD_REQUEST, Json("Payload sem customerData em checkout".to_string())).into_response();
        }
        let customer_data = customer_data.unwrap();
        let email_payload = customer_data.get("email").and_then(|v| v.as_str()).unwrap_or("");
        let cpf_payload = customer_data.get("cpfCnpj").and_then(|v| v.as_str()).unwrap_or("");
        if email_payload.is_empty() && cpf_payload.is_empty() {
            return (StatusCode::BAD_REQUEST, Json("Payload sem email e cpfCnpj em customerData".to_string())).into_response();
        }
        let mut usuario_encontrado: Option<crate::models::Usuario> = None;
        if !email_payload.is_empty() {
            usuario_encontrado = usuarios.filter(email.eq(email_payload)).first::<crate::models::Usuario>(conn).ok();
        }
        if usuario_encontrado.is_none() && !cpf_payload.is_empty() {
            usuario_encontrado = usuarios.filter(cpfcnpj.eq(cpf_payload)).first::<crate::models::Usuario>(conn).ok();
        }
        if usuario_encontrado.is_none() {
            return (StatusCode::BAD_REQUEST, Json(format!("Usuário não encontrado: Email={}, CPF={}", email_payload, cpf_payload))).into_response();
        }
        let usuario = usuario_encontrado.unwrap();
        let hoje = Utc::now().naive_utc();
    // Extrai id do webhook (será usado como asaas_subscription_id)
    let webhook_id = payload.get("id").and_then(|v| v.as_str()).unwrap_or("webhook_seed").to_string();

    match assinaturas.filter(id_usuario.eq(&usuario.id)).order(periodo_fim.desc()).first::<crate::models::assinatura::Assinatura>(conn) {
        Ok(assinatura) => {
            // Renova usando função centralizada
            // Extrai quantity do payload (checkout.items[0].quantity) e usa como meses.
            // Se não encontrar, usa 1 como fallback.
            let meses_payload = payload.get("checkout")
                .and_then(|c| c.get("items"))
                .and_then(|it| it.as_array())
                .and_then(|arr| arr.get(0))
                .and_then(|item| item.get("quantity"))
                .and_then(|q| q.as_i64())
                .unwrap_or(1);

            if let Err(e) = crate::services::assinatura::renovar_assinatura_por_usuario(usuario.id.clone(), meses_payload).await {
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(format!("Erro ao renovar assinatura: {}", e))).into_response();
            }
            // Atualiza o campo asaas_subscription_id para o id do webhook
            use crate::schema::assinaturas::dsl::asaas_subscription_id;
            if let Err(e) = diesel::update(assinaturas.filter(assinatura_id.eq(&assinatura.id)))
                .set((asaas_subscription_id.eq(webhook_id.clone()), assinatura_atualizado_em.eq(hoje)))
                .execute(conn) {
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(format!("Erro ao atualizar asaas_subscription_id: {:?}", e))).into_response();
            }
        }
        Err(diesel::result::Error::NotFound) => {
            // Cria nova assinatura usando a função create_assinatura
            let meses_payload = payload.get("checkout")
                .and_then(|c| c.get("items"))
                .and_then(|it| it.as_array())
                .and_then(|arr| arr.get(0))
                .and_then(|item| item.get("quantity"))
                .and_then(|q| q.as_i64())
                .unwrap_or(1);

            let nova = crate::models::assinatura::NewAssinatura {
                id: ulid::Ulid::new().to_string(),
                id_usuario: usuario.id.clone(),
                asaas_subscription_id: webhook_id.clone(),
                periodo_inicio: hoje,
                periodo_fim: hoje + Duration::days(30 * meses_payload),
                criado_em: hoje,
                atualizado_em: hoje,
            };
            // usamos a função pública do módulo de assinatura para criar (mantém lógica centralizada)
            let _ = crate::services::assinatura::create_assinatura(axum::Json(nova)).await;
        }
        Err(e) => {
            return (StatusCode::INTERNAL_SERVER_ERROR, Json(format!("Erro ao buscar assinatura: {:?}", e))).into_response();
        }
    }
    (StatusCode::OK, Json("Assinatura processada com sucesso".to_string())).into_response()
    }

    pub fn routes() -> Router {
        Router::new().route("/api/webhook/pagamento", post(receber_webhook))
    }
}
