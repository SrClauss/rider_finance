use axum::{http::StatusCode, extract::ConnectInfo};
use std::net::SocketAddr;
use axum::http::HeaderMap;
use axum::{Router, routing::post, Json};
use axum::response::IntoResponse;
use serde_json::Value;

    // Nota: verificação por IP removida — agora o webhook exige um token

    pub async fn receber_webhook(
        ConnectInfo(_addr): ConnectInfo<SocketAddr>,
        headers: HeaderMap,
        Json(payload): Json<Value>
    ) -> axum::response::Response {
     
        eprintln!("--- Webhook headers start ---");
        eprintln!("{headers:#?}"); // imprime em formato debug (com quebra de linhas)
        let expected = match std::env::var("ASAAS_WEBHOOK_TOKEN") {
            Ok(v) => v,
            Err(_) => {
                let resp = (StatusCode::UNAUTHORIZED, Json("ASAAS_WEBHOOK_TOKEN não configurado".to_string()));
                return resp.into_response();
            }
        };
        let provided = headers.get("asaas-access-token").and_then(|h| h.to_str().ok()).unwrap_or("");
        if provided != expected {
            let resp = (StatusCode::UNAUTHORIZED, Json("Token de webhook inválido".to_string()));
            return resp.into_response();
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
            let resp = (StatusCode::BAD_REQUEST, Json("Payload sem customerData em checkout".to_string()));
            return resp.into_response();
        }
        let customer_data = customer_data.unwrap();
        let email_payload = customer_data.get("email").and_then(|v| v.as_str()).unwrap_or("");
        let cpf_payload = customer_data.get("cpfCnpj").and_then(|v| v.as_str()).unwrap_or("");
        if email_payload.is_empty() && cpf_payload.is_empty() {
            let resp = (StatusCode::BAD_REQUEST, Json("Payload sem email e cpfCnpj em customerData".to_string()));
            return resp.into_response();
        }
        let mut usuario_encontrado: Option<crate::models::Usuario> = None;
        if !email_payload.is_empty() {
            usuario_encontrado = usuarios.filter(email.eq(email_payload)).first::<crate::models::Usuario>(conn).ok();
        }
        if usuario_encontrado.is_none() && !cpf_payload.is_empty() {
            usuario_encontrado = usuarios.filter(cpfcnpj.eq(cpf_payload)).first::<crate::models::Usuario>(conn).ok();
        }
        if usuario_encontrado.is_none() {
            let resp = (StatusCode::BAD_REQUEST, Json(format!("Usuário não encontrado: Email={email_payload}, CPF={cpf_payload}")));
            return resp.into_response();
        }
        let usuario = usuario_encontrado.unwrap();
        let hoje = Utc::now();
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
                .and_then(|arr| arr.first())
                .and_then(|item| item.get("quantity"))
                .and_then(|q| q.as_i64())
                .unwrap_or(1);

            if let Err(e) = crate::services::assinatura::renovar_assinatura_por_usuario(usuario.id.clone(), meses_payload).await {
                let resp = (StatusCode::INTERNAL_SERVER_ERROR, Json(format!("Erro ao renovar assinatura: {e}")));
                return resp.into_response();
            }
            // Atualiza o campo asaas_subscription_id para o id do webhook
            use crate::schema::assinaturas::dsl::asaas_subscription_id;
                if let Err(e) = diesel::update(assinaturas.filter(assinatura_id.eq(&assinatura.id)))
                    .set((asaas_subscription_id.eq(webhook_id.clone()), assinatura_atualizado_em.eq(hoje)))
                    .execute(conn) {
                    let resp = (StatusCode::INTERNAL_SERVER_ERROR, Json(format!("Erro ao atualizar asaas_subscription_id: {e:?}")));
                    return resp.into_response();
                }
        }
        Err(diesel::result::Error::NotFound) => {
            // Cria nova assinatura usando a função create_assinatura
            let meses_payload = payload.get("checkout")
                .and_then(|c| c.get("items"))
                .and_then(|it| it.as_array())
                .and_then(|arr| arr.first())
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
            let resp = (StatusCode::INTERNAL_SERVER_ERROR, Json(format!("Erro ao buscar assinatura: {e:?}")));
            return resp.into_response();
        }
    }
    (StatusCode::OK, Json("Assinatura processada com sucesso".to_string())).into_response()
    }

pub fn routes() -> Router {
    Router::new().route("/api/webhook/pagamento", post(receber_webhook))
}

// --- Log dos cabeçalhos do webhook (colar aqui) ---
