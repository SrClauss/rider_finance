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
    ) -> impl IntoResponse {
        // Tenta pegar o IP do header X-Forwarded-For
        let ip = if let Some(forwarded) = headers.get("x-forwarded-for") {
            forwarded.to_str().unwrap_or("").split(',').next().unwrap_or("").trim().to_string()
        } else {
            addr.ip().to_string()
        };
        if !ASAAS_IPS.contains(&ip.as_str()) {
            println!("Tentativa de acesso de IP não autorizado: {}", ip);
            return (StatusCode::UNAUTHORIZED, Json("IP não autorizado".to_string()));
        }
        let pretty = serde_json::to_string_pretty(&payload).unwrap();
        println!("Webhook recebido:\n{}", pretty);

        // --- Busca dados do cliente ---
        use crate::db;
        use crate::schema::assinaturas::dsl::{assinaturas, id as assinatura_id, atualizado_em as assinatura_atualizado_em, periodo_inicio, periodo_fim, id_usuario};
        use crate::schema::usuarios::dsl::*;
        use diesel::prelude::*;
        use chrono::{Utc, Duration};
        let conn = &mut db::establish_connection();
        let customer_data = payload.get("checkout")
            .and_then(|v| v.get("customerData"))
            .and_then(|v| v.as_object());
        if customer_data.is_none() {
            println!("Payload sem customerData em checkout. Payload recebido: {:?}", payload);
            return (StatusCode::BAD_REQUEST, Json("Payload sem customerData em checkout".to_string()));
        }
        let customer_data = customer_data.unwrap();
        let email_payload = customer_data.get("email").and_then(|v| v.as_str()).unwrap_or("");
        let cpf_payload = customer_data.get("cpfCnpj").and_then(|v| v.as_str()).unwrap_or("");
        if email_payload.is_empty() && cpf_payload.is_empty() {
            println!("Payload sem email e cpfCnpj em customerData. Payload recebido: {:?}", payload);
            return (StatusCode::BAD_REQUEST, Json("Payload sem email e cpfCnpj em customerData".to_string()));
        }
        let mut usuario_encontrado: Option<crate::models::Usuario> = None;
        if !email_payload.is_empty() {
            usuario_encontrado = usuarios.filter(email.eq(email_payload)).first::<crate::models::Usuario>(conn).ok();
        }
        if usuario_encontrado.is_none() && !cpf_payload.is_empty() {
            usuario_encontrado = usuarios.filter(cpfcnpj.eq(cpf_payload)).first::<crate::models::Usuario>(conn).ok();
        }
        if usuario_encontrado.is_none() {
            println!("Usuário não encontrado: Email={}, CPF={}", email_payload, cpf_payload);
            return (StatusCode::BAD_REQUEST, Json(format!("Usuário não encontrado: Email={}, CPF={}", email_payload, cpf_payload)));
        }
        let usuario = usuario_encontrado.unwrap();
        let hoje = Utc::now().naive_utc();
        match assinaturas.filter(id_usuario.eq(&usuario.id)).order(periodo_fim.desc()).first::<crate::models::Assinatura>(conn) {
            Ok(mut assinatura) => {
                // Se vencida
                if assinatura.periodo_fim < hoje {
                    assinatura.periodo_inicio = hoje;
                    assinatura.periodo_fim = hoje + Duration::days(30);
                } else {
                    assinatura.periodo_fim = assinatura.periodo_fim + Duration::days(30);
                }
                assinatura.atualizado_em = hoje;
                if let Err(e) = diesel::update(assinaturas.filter(assinatura_id.eq(&assinatura.id)))
                    .set((periodo_inicio.eq(assinatura.periodo_inicio), periodo_fim.eq(assinatura.periodo_fim), assinatura_atualizado_em.eq(assinatura.atualizado_em)))
                    .execute(conn) {
                    println!("Erro ao atualizar assinatura: {:?}", e);
                    return (StatusCode::INTERNAL_SERVER_ERROR, Json(format!("Erro ao atualizar assinatura: {:?}", e)));
                }
                println!("Assinatura atualizada para usuário {}", usuario.id);
            }
            Err(diesel::result::Error::NotFound) => {
                // Cria nova assinatura
                let nova = crate::models::NewAssinatura {
                    id: ulid::Ulid::new().to_string(),
                    id_usuario: usuario.id.clone(),
                    status: "ativa".to_string(),
                    asaas_subscription_id: None,
                    periodo_inicio: hoje,
                    periodo_fim: hoje + Duration::days(30),
                    cancelada_em: None,
                    criado_em: hoje,
                    atualizado_em: hoje,
                    billing_type: None,
                    charge_type: None,
                    webhook_event_id: None,
                    checkout_id: None,
                    checkout_status: None,
                    checkout_date_created: None,
                    valor: None,
                    checkout_event_type: None,
                    descricao: None,
                    nome_cliente: None,
                    email_cliente: None,
                    cpf_cnpj_cliente: None,
                };
                if let Err(e) = diesel::insert_into(assinaturas)
                    .values(&nova)
                    .execute(conn) {
                    println!("Erro ao criar assinatura: {:?}", e);
                    return (StatusCode::INTERNAL_SERVER_ERROR, Json(format!("Erro ao criar assinatura: {:?}", e)));
                }
                println!("Assinatura criada para usuário {}", usuario.id);
            }
            Err(e) => {
                println!("Erro ao buscar assinatura: {:?}", e);
                return (StatusCode::INTERNAL_SERVER_ERROR, Json(format!("Erro ao buscar assinatura: {:?}", e)));
            }
        }
        (StatusCode::OK, Json("Assinatura processada com sucesso".to_string()))
    }

    pub fn routes() -> Router {
        Router::new().route("/api/webhook/pagamento", post(receber_webhook))
    }
}
