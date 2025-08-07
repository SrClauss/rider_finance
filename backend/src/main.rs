use axum::{Router, routing::{post, get, put, delete}};
use backend::services::auth::{register_user_handler, register_pending_user_handler, reset_password_handler, login_handler};
use backend::services::auth::request_password_reset::request_password_reset_handler;
use backend::services::captcha::generate_captcha_handler;

#[tokio::main]
async fn main() {
    use backend::services::dashboard::dashboard_stats_handler;
    use backend::services::transacao::{create_transacao_handler, get_transacao_handler, list_transacoes_handler, update_transacao_handler, delete_transacao_handler};
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
        .route("/api/captcha", get(generate_captcha_handler));

    println!("🚀 Servidor rodando em http://127.0.0.1:8000");
    use axum::serve;
    use tokio::net::TcpListener;
    let listener = TcpListener::bind("127.0.0.1:8000").await.unwrap();
    serve(listener, app).await.unwrap();
}
