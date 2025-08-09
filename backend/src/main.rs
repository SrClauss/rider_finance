use axum::{Router, routing::{post, get, put, delete}};
use backend::services::auth::{register_user_handler, register_pending_user_handler, reset_password_handler, login_handler};
use backend::services::auth::request_password_reset::request_password_reset_handler;
use backend::services::captcha::generate_captcha_handler;
use backend::db;
use backend::services::configuracao;

#[tokio::main]
async fn main() {
    use backend::services::dashboard::dashboard_stats_handler;
    use backend::services::transacao::{create_transacao_handler, get_transacao_handler, list_transacoes_handler, update_transacao_handler, delete_transacao_handler};
    use backend::services::meta::{list_metas_a_cumprir_handler, list_metas_cumpridas_handler};
    use backend::services::categoria::{create_categoria_handler, list_categorias_handler, get_categoria_handler, delete_categoria_handler};
    use backend::services::assinatura::{create_assinatura_handler, get_assinatura_handler, list_assinaturas_handler, delete_assinatura_handler, asaas_webhook_handler, criar_checkout_handler};
    use backend::services::configuracao::{checkout_info_handler, nome_completo_handler};
    let app = Router::new()
        .route("/api/register", post(register_user_handler))
        .route("/api/register-pending", post(register_pending_user_handler))
        .route("/api/reset-password/{id}", post(reset_password_handler))
        .route("/api/request-password-reset", post(request_password_reset_handler))
        .route("/api/login", post(login_handler))
        .route("/api/dashboard/stats", get(dashboard_stats_handler))
        .route("/api/transacao", post(create_transacao_handler))
        .route("/api/transacao/{id}", get(get_transacao_handler))
        .route("/api/transacao/{id}", put(update_transacao_handler))
        .route("/api/transacao/{id}", delete(delete_transacao_handler))
        .route("/api/transacoes/{id_usuario}", get(list_transacoes_handler))
        .route("/api/captcha", get(generate_captcha_handler))
        .route("/api/meta/a_cumprir/{id_usuario}", get(list_metas_a_cumprir_handler))
        .route("/api/meta/cumpridas/{id_usuario}", get(list_metas_cumpridas_handler))
        .route("/api/categoria", post(create_categoria_handler))
        .route("/api/categoria/{id}", get(get_categoria_handler))
        .route("/api/categoria/{id}", delete(delete_categoria_handler))
        .route("/api/categorias/{id_usuario}", get(list_categorias_handler))
        .route("/api/assinatura", post(create_assinatura_handler))
        .route("/api/assinatura/{id}", get(get_assinatura_handler))
    .route("/api/checkout-info", get(checkout_info_handler))
    .route("/api/usuario/nome-completo/{id}", get(nome_completo_handler))
        .route("/api/assinatura/{id}", delete(delete_assinatura_handler))
        .route("/api/assinaturas/{id_usuario}", get(list_assinaturas_handler))
        .route("/api/assinatura/criar", post(backend::services::assinatura::criar_cliente_handler))
    .route("/api/assinatura/checkout", post(criar_checkout_handler))
        // .route("/api/usuario/{id}", get(get_usuario_info_handler)) // Removido pois não existe ou está no lugar errado
        .route("/api/webhook/asaas", post(asaas_webhook_handler));

    // Seed automático de configurações iniciais no main
    let conn = &mut db::establish_connection();
    configuracao::seed_configuracoes_padrao(conn);

    println!("🚀 Servidor rodando em http://127.0.0.1:8000");
    use axum::serve;
    use tokio::net::TcpListener;
    let listener = TcpListener::bind("127.0.0.1:8000").await.unwrap();
    serve(listener, app).await.unwrap();
}
