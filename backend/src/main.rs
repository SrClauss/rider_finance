use axum::{Router, routing::post};
use backend::services::auth::{register_user_handler, register_pending_user_handler, reset_password_handler, login_handler};

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/register", post(register_user_handler))
        .route("/register-pending", post(register_pending_user_handler))
        .route("/reset-password/{id}", post(reset_password_handler))
        .route("/login", post(login_handler));

    println!("🚀 Servidor rodando em http://127.0.0.1:8000");
    use axum::serve;
    use tokio::net::TcpListener;
    let listener = TcpListener::bind("127.0.0.1:8000").await.unwrap();
    serve(listener, app).await.unwrap();
}
