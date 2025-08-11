use axum::{response::IntoResponse, http::{StatusCode, header, Response}};

pub async fn logout_handler() -> impl IntoResponse {
    // Cria um cookie expirado para sobrescrever o token http-only
    let cookie = format!(
        "token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
    );
    Response::builder()
        .status(StatusCode::OK)
        .header(header::SET_COOKIE, cookie)
        .body(String::from("Logout realizado com sucesso"))
        .unwrap()
}
