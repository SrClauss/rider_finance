use axum::{Router, routing::post, Json, extract::Path};
use serde::Deserialize;
use backend::models::{NewUsuario};
use backend::services::auth::{register, register_pending, reset_password};

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/register", post(register_user_handler))
        .route("/register-pending", post(register_pending_user_handler))
        .route("/reset-password/:id", post(reset_password_handler));

    println!("🚀 Servidor rodando em http://127.0.0.1:3000");
    use axum::serve;
    use tokio::net::TcpListener;
    let listener = TcpListener::bind("127.0.0.1:3000").await.unwrap();
    serve(listener, app).await.unwrap();
}

#[derive(Deserialize)]
struct RegisterPayload {
    nome_usuario: String,
    email: String,
    senha: String,
}

async fn register_user_handler(Json(payload): Json<RegisterPayload>) -> Json<String> {
    let usuario = NewUsuario::new(
        None,
        payload.nome_usuario,
        payload.email,
        payload.senha,
        None, None, None, None, false, None, None, None, None, None, None, None
    );
    match register::register_user(usuario) {
        Ok(_) => Json("Usuário registrado com sucesso".to_string()),
        Err(e) => Json(format!("Erro: {}", e)),
    }
}

#[derive(Deserialize)]
struct RegisterPendingPayload {
    nome_usuario: String,
    email: String,
}

async fn register_pending_user_handler(Json(payload): Json<RegisterPendingPayload>) -> Json<String> {
    let usuario = NewUsuario::new(
        None,
        payload.nome_usuario,
        payload.email,
        "".to_string(),
        None, None, None, None, false, None, None, None, None, None, None, None
    );
    match register_pending::register_pending_user(usuario) {
        Ok(_) => Json("Usuário pendente registrado com sucesso".to_string()),
        Err(e) => Json(format!("Erro: {}", e)),
    }
}

#[derive(Deserialize)]
struct ResetPasswordPayload {
    nova_senha: String,
}

async fn reset_password_handler(Path(id): Path<String>, Json(payload): Json<ResetPasswordPayload>) -> Json<String> {
    match reset_password::reset_password(&id, &payload.nova_senha) {
        Ok(_) => Json("Senha redefinida com sucesso".to_string()),
        Err(e) => Json(format!("Erro: {}", e)),
    }
}
