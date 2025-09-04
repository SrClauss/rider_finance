use axum::{response::IntoResponse, http::{StatusCode, header, Response}};

pub async fn logout_handler() -> impl IntoResponse {
    // Cria um cookie expirado para sobrescrever o token http-only
    let cookie = "token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax".to_string();
    Response::builder()
        .status(StatusCode::OK)
        .header(header::SET_COOKIE, cookie)
        .body(String::from("Logout realizado com sucesso"))
        .unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::StatusCode;
    use axum::response::IntoResponse;

    #[tokio::test]
    async fn test_logout_handler() {
        let resp = logout_handler().await.into_response();
        assert_eq!(resp.status(), StatusCode::OK);
        let headers = resp.headers();
        assert!(headers.get("set-cookie").is_some());
    }
}
