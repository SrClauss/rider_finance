extern crate backend;
use axum::http::{StatusCode, Request};
use axum::body::{Body, to_bytes};
use axum::Router;
use tower::ServiceExt; // for `oneshot`
use diesel::prelude::*;
use backend::db;
use backend::models::usuarios::dsl::*;

fn clean_db() {
    let conn = &mut db::establish_connection();
    diesel::delete(usuarios).execute(conn).ok();
}

#[tokio::test]
async fn test_login_endpoint() {
    clean_db();
    let app = backend::api::auth::router();
    // Registra usuário
    let payload = serde_json::json!({
        "nome_usuario": "loginuser",
        "email": "login@example.com",
        "senha": "senha123"
    });
    let req = Request::builder()
        .method("POST")
        .uri("/register")
        .header("content-type", "application/json")
        .body(Body::from(payload.to_string()))
        .unwrap();
    let resp = app.clone().oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);

    // Testa login correto
    let login_payload = serde_json::json!({
        "usuario": "loginuser",
        "senha": "senha123"
    });
    let req = Request::builder()
        .method("POST")
        .uri("/login")
        .header("content-type", "application/json")
        .body(Body::from(login_payload.to_string()))
        .unwrap();
    let resp = app.clone().oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = to_bytes(resp.into_body(), 1024 * 1024).await.unwrap();
    let body_str = std::str::from_utf8(&body).unwrap();
    assert!(body_str.contains("Login bem-sucedido"));

    // Testa login errado
    let login_payload = serde_json::json!({
        "usuario": "loginuser",
        "senha": "errada"
    });
    let req = Request::builder()
        .method("POST")
        .uri("/login")
        .header("content-type", "application/json")
        .body(Body::from(login_payload.to_string()))
        .unwrap();
    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
    let body = to_bytes(resp.into_body(), 1024 * 1024).await.unwrap();
    let body_str = std::str::from_utf8(&body).unwrap();
    assert!(body_str.contains("Erro de login"));
}

#[tokio::test]
async fn test_register_user() {
    clean_db();
    let app = backend::api::auth::router();
    let payload = serde_json::json!({
        "nome_usuario": "testuser",
        "email": "test@example.com",
        "senha": "123456"
    });
    let req = Request::builder()
        .method("POST")
        .uri("/register")
        .header("content-type", "application/json")
        .body(Body::from(payload.to_string()))
        .unwrap();
    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_register_pending_user() {
    clean_db();
    let app = backend::api::auth::router();
    let payload = serde_json::json!({
        "nome_usuario": "pendinguser",
        "email": "pending@example.com"
    });
    let req = Request::builder()
        .method("POST")
        .uri("/register-pending")
        .header("content-type", "application/json")
        .body(Body::from(payload.to_string()))
        .unwrap();
    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_reset_password() {
    clean_db();
    let app = backend::api::auth::router();
    let payload = serde_json::json!({
        "nova_senha": "novasenha123"
    });
    let req = Request::builder()
        .method("POST")
        .uri("/reset-password/test-id")
        .header("content-type", "application/json")
        .body(Body::from(payload.to_string()))
        .unwrap();
    let resp = app.oneshot(req).await.unwrap();
    assert_eq!(resp.status(), StatusCode::OK);
}
