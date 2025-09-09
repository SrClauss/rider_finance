use axum::{ Json, response::IntoResponse };
use axum::http::{ StatusCode, HeaderMap, header };
use axum_extra::extract::cookie::CookieJar;
use chrono::{Utc, TimeZone};

use crate::db;
use crate::models::{ Admin, Usuario };
use crate::schema::admins::dsl as admin_dsl;
use crate::schema::usuarios::dsl as usuarios_dsl;
use diesel::prelude::*;
use jsonwebtoken::{ encode, decode, Header, EncodingKey, DecodingKey, Validation, Algorithm };
use serde::{ Deserialize, Serialize };

#[derive(Deserialize)]
pub struct AdminRequestResetPayload {
    pub username: String,
}

#[derive(Deserialize)]
pub struct AdminResetPayload {
    pub token: String,
    pub new_password: String,
}

#[derive(Deserialize)]
pub struct CreateAdminPayload {
    pub username: String,
    pub password: String,
}

// Em ambiente de desenvolvimento retornamos o token no corpo; em produção deve enviar por e-mail
pub async fn admin_request_reset_handler(Json(
    payload,
): Json<AdminRequestResetPayload>) -> impl IntoResponse {
    let conn = &mut db::establish_connection();
    // localizar admin de forma econômica: buscar apenas o `id` ao invés de desserializar toda a struct
    if
        admin_dsl::admins
            .filter(admin_dsl::username.eq(&payload.username))
            .select(admin_dsl::id)
            .first::<String>(conn)
            .is_ok()
    {
        // gerar token simples e armazenar em memória/DB - para simplicidade salvamos em uma tabela `admin_reset_tokens` não implementada
        // aqui apenas retornamos o token no corpo (dev)
        let token = uuid::Uuid::new_v4().to_string();
        // Em produção: salvar hash(token) no DB com expiry e enviar por email
        let resp = serde_json::json!({"ok": true, "token": token});
        return (StatusCode::OK, Json(resp));
    }
    (StatusCode::BAD_REQUEST, Json(serde_json::json!({"message": "admin not found"})))
}

// Reset via token (dev helper - procura admin pelo username implícito no token não implementado)
pub async fn admin_reset_password_handler(Json(
    payload,
): Json<AdminResetPayload>) -> impl IntoResponse {
    // Para simplificar: token não verificado; em produção validar token salvo
    // Aqui assumimos token válido e atualizamos o admin padrão 'admin'
    let conn = &mut db::establish_connection();
    if
        let Ok(admin) = admin_dsl::admins
            .filter(admin_dsl::username.eq("admin"))
            .first::<Admin>(conn)
    {
        let new_hash = bcrypt::hash(&payload.new_password, bcrypt::DEFAULT_COST).unwrap();
        diesel
            ::update(admin_dsl::admins.filter(admin_dsl::id.eq(&admin.id)))
            .set((
                admin_dsl::password_hash.eq(new_hash),
                admin_dsl::atualizado_em.eq(chrono::Utc::now()),
            ))
            .execute(conn)
            .ok();
        return (
            StatusCode::OK,
            Json(serde_json::json!({"ok": true, "message": "password updated"})),
        );
    }
    (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"ok": false, "message": "failed"})))
}

// Criar novo admin (exige cookie admin)
pub async fn create_admin_handler(
    jar: CookieJar,
    Json(payload): Json<CreateAdminPayload>
) -> impl IntoResponse {
    if validate_admin_cookie(&jar).is_none() {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message": "unauthorized"})));
    }
    let conn = &mut db::establish_connection();
    let hash = bcrypt::hash(&payload.password, bcrypt::DEFAULT_COST).unwrap();
    let new = crate::models::NewAdmin::new(payload.username.clone(), hash);
    match diesel::insert_into(admin_dsl::admins).values(&new).execute(conn) {
        Ok(_) => (StatusCode::CREATED, Json(serde_json::json!({"ok": true}))),
        Err(e) =>
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"ok": false, "error": format!("{}", e)})),
            ),
    }
}

#[derive(Deserialize)]
pub struct AdminLoginPayload {
    pub usuario: String,
    pub senha: String,
    pub captcha_token: Option<String>,
    pub captcha_answer: Option<String>,
}

#[derive(Deserialize)]
pub struct ChangePasswordPayload {
    pub username: String,
    pub old_password: String,
    pub new_password: String,
}

#[derive(Serialize)]
pub struct AdminListItem {
    pub id: String,
    pub username: String,
    pub criado_em: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Serialize)]
pub struct PaginatedUsers {
    pub items: Vec<Usuario>,
    pub total: i64,
    pub page: i64,
    pub size: i64,
}

// Admin login: simples, retorna 200 se ok (implement JWT admin se desejado)
pub async fn admin_login_handler(Json(payload): Json<AdminLoginPayload>) -> impl IntoResponse {
    let conn = &mut db::establish_connection();

    // Validate captcha first
    if payload.captcha_token.as_ref().and(payload.captcha_answer.as_ref()).is_none() {
        let headers = HeaderMap::new();
        return (
            StatusCode::BAD_REQUEST,
            headers,
            Json(serde_json::json!({"message": "captcha required"})),
        ).into_response();
    }
    if
        let (Some(token), Some(answer)) = (
            payload.captcha_token.as_ref(),
            payload.captcha_answer.as_ref(),
        )
    {
        if !crate::services::captcha::validate_captcha(token, answer) {
            let headers = HeaderMap::new();
            return (
                StatusCode::BAD_REQUEST,
                headers,
                Json(serde_json::json!({"message": "invalid captcha"})),
            ).into_response();
        }
    }

    // Prepare default response
    let mut status = StatusCode::UNAUTHORIZED;
    let mut headers = HeaderMap::new();
    let mut body = serde_json::json!({"message": "invalid credentials"});

    if
        let Ok(admin) = admin_dsl::admins
            .filter(admin_dsl::username.eq(&payload.usuario))
            .first::<Admin>(conn)
    {
        if bcrypt::verify(&payload.senha, &admin.password_hash).unwrap_or(false) {
            // generate token
            #[derive(Serialize, Deserialize)]
            struct Claims {
                sub: String,
                exp: usize,
            }
            let expiration = (chrono::Utc::now().timestamp() as usize) + 60 * 60 * 24; // 24h
            let claims = Claims { sub: admin.id.clone(), exp: expiration };
            let secret = std::env
                ::var("ADMIN_JWT_SECRET")
                .unwrap_or_else(|_|
                    std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string())
                );
            match encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_ref())) {
                Ok(token) => {
                    let cookie_value = format!(
                        "admin_auth_token={token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax"
                    );
                    headers.insert(header::SET_COOKIE, cookie_value.parse().unwrap());
                    status = StatusCode::OK;
                    body =
                        serde_json::json!({"message": format!("admin authenticated: {}", admin.username)});
                }
                Err(_) => {
                    status = StatusCode::INTERNAL_SERVER_ERROR;
                    body = serde_json::json!({"message": "failed to generate token"});
                }
            }
        }
    }

    (status, headers, Json(body)).into_response()
}

// Change password (basic): verifies old password and updates hash
fn validate_admin_cookie(jar: &CookieJar) -> Option<String> {
    if let Some(cookie) = jar.get("admin_auth_token") {
        let token = cookie.value();
        let secret = std::env
            ::var("ADMIN_JWT_SECRET")
            .unwrap_or_else(|_|
                std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string())
            );
        let validation = Validation::new(Algorithm::HS256);
        if
            let Ok(data) = decode::<serde_json::Value>(
                token,
                &DecodingKey::from_secret(secret.as_ref()),
                &validation
            )
        {
            // Expect `sub` claim to be admin id
            if let Some(sub) = data.claims.get("sub") {
                if let Some(s) = sub.as_str() {
                    return Some(s.to_string());
                }
            }
        }
    }
    None
}

pub async fn admin_change_password_handler(
    jar: CookieJar,
    Json(payload): Json<ChangePasswordPayload>
) -> impl IntoResponse {
    // Now only allow changing password for the authenticated admin (cookie-derived id)
    let auth_admin_id = match validate_admin_cookie(&jar) {
        Some(id) => id,
        None => {
            return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message": "unauthorized"})));
        }
    };
    let conn = &mut db::establish_connection();
    // load the auth admin
    if
        let Ok(auth_admin) = admin_dsl::admins
            .filter(admin_dsl::id.eq(&auth_admin_id))
            .first::<Admin>(conn)
    {
        // ensure payload.username matches auth_admin.username (so you can only change your own password)
        if auth_admin.username != payload.username {
            return (
                StatusCode::FORBIDDEN,
                Json(serde_json::json!({"message": "cannot change another admin password"})),
            );
        }
        if bcrypt::verify(&payload.old_password, &auth_admin.password_hash).unwrap_or(false) {
            let new_hash = bcrypt::hash(&payload.new_password, bcrypt::DEFAULT_COST).unwrap();
            let _ = diesel
                ::update(admin_dsl::admins.filter(admin_dsl::id.eq(&auth_admin.id)))
                .set((
                    admin_dsl::password_hash.eq(new_hash),
                    admin_dsl::atualizado_em.eq(chrono::Utc::now()),
                ))
                .execute(conn);
            return (StatusCode::OK, Json(serde_json::json!({"message": "password changed"})));
        }
    }
    (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message": "invalid credentials"})))
}

// List admins
pub async fn list_admins_handler(jar: CookieJar) -> impl IntoResponse {
    if validate_admin_cookie(&jar).is_none() {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message": "unauthorized"})));
    }
    let conn = &mut db::establish_connection();
    match admin_dsl::admins.load::<Admin>(conn) {
        Ok(items) => {
            let mapped: Vec<AdminListItem> = items
                .into_iter()
                .map(|a| AdminListItem {
                    id: a.id,
                    username: a.username,
                    criado_em: Some(a.criado_em),
                })
                .collect();
            (StatusCode::OK, Json(serde_json::json!({"items": mapped})))
        }
        Err(_) =>
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"message": "failed"}))),
    }
}

// Delete admin by id — only allowed if requester is authenticated admin
pub async fn delete_admin_handler(
    jar: CookieJar,
    axum::extract::Path(admin_id): axum::extract::Path<String>
) -> impl IntoResponse {
    let auth = match validate_admin_cookie(&jar) {
        Some(id) => id,
        None => {
            return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message": "unauthorized"})));
        }
    };
    // Prevent self-deletion
    if auth == admin_id {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"message": "cannot delete yourself"})),
        );
    }
    let conn = &mut db::establish_connection();
    // Prevent deleting default 'admin' username
    if let Ok(target) = admin_dsl::admins.filter(admin_dsl::id.eq(&admin_id)).first::<Admin>(conn) {
        if target.username == "admin" {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({"message": "cannot delete default admin"})),
            );
        }
    }
    match diesel::delete(admin_dsl::admins.filter(admin_dsl::id.eq(admin_id))).execute(conn) {
        Ok(affected) => {
            if affected > 0 {
                (StatusCode::OK, Json(serde_json::json!({"ok": true})))
            } else {
                (StatusCode::NOT_FOUND, Json(serde_json::json!({"message": "not found"})))
            }
        }
        Err(e) =>
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"message": format!("error: {}", e)})),
            ),
    }
}

// List users paginated with optional filters name, cpf, blocked
#[derive(Deserialize)]
pub struct ListUsersQuery {
    pub page: Option<i64>,
    pub size: Option<i64>,
    // `q` é o parâmetro usado pelo frontend para pesquisa por nome
    pub q: Option<String>,
    // manter compatibilidade com `name` se necessário
    pub name: Option<String>,
    pub cpf: Option<String>,
    pub blocked: Option<bool>,
}
pub async fn list_users_handler(
    jar: CookieJar,
    axum::extract::Query(query): axum::extract::Query<ListUsersQuery>
) -> impl IntoResponse {
    // Handler exige cookie admin_auth_token
    if validate_admin_cookie(&jar).is_none() {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message": "unauthorized"})));
    }
    let conn = &mut db::establish_connection();
    let page = query.page.unwrap_or(1).max(1);
    let size = query.size.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * size;

    let mut base = usuarios_dsl::usuarios.into_boxed();
    // pesquisa por nome: aceitar tanto `q` quanto `name` e procurar em nome_completo OU nome_usuario
    if let Some(ref s) = query.q.as_ref().or(query.name.as_ref()) {
        let pattern = format!("%{s}%");
        base = base.filter(
            usuarios_dsl::nome_completo
                .ilike(pattern.clone())
                .or(usuarios_dsl::nome_usuario.ilike(pattern))
        );
    }
    if let Some(ref cpf) = query.cpf {
        let cpf_norm = cpf.replace(['.', '-'], "");
        base = base.filter(usuarios_dsl::cpfcnpj.ilike(format!("%{cpf_norm}%")));
    }
    if let Some(blocked_flag) = query.blocked {
        base = base.filter(usuarios_dsl::blocked.eq(blocked_flag));
    }

    // Recriar query para contagem (não podemos clonar BoxedSelectStatement)
    let mut count_q = usuarios_dsl::usuarios.into_boxed();
    if let Some(ref s) = query.q.as_ref().or(query.name.as_ref()) {
        let pattern = format!("%{s}%");
        count_q = count_q.filter(
            usuarios_dsl::nome_completo
                .ilike(pattern.clone())
                .or(usuarios_dsl::nome_usuario.ilike(pattern))
        );
    }
    if let Some(ref cpf) = &query.cpf {
        let cpf_norm = cpf.replace(['.', '-'], "");
        count_q = count_q.filter(usuarios_dsl::cpfcnpj.ilike(format!("%{cpf_norm}%")));
    }
    if let Some(blocked_flag) = query.blocked {
        count_q = count_q.filter(usuarios_dsl::blocked.eq(blocked_flag));
    }
    let total = count_q.count().get_result::<i64>(conn).unwrap_or(0);
    let items = base.offset(offset).limit(size).load::<Usuario>(conn).unwrap_or_default();

    // Carregar assinaturas para os usuários retornados em uma única query
    let user_ids: Vec<String> = items
        .iter()
        .map(|u| u.id.clone())
        .collect();
    use crate::schema::assinaturas::dsl as assin_dsl;
    let assinaturas_all: Vec<crate::models::assinatura::Assinatura> = if user_ids.is_empty() {
        Vec::new()
    } else {
        assin_dsl::assinaturas
            .filter(assin_dsl::id_usuario.eq_any(&user_ids))
            .order(assin_dsl::periodo_fim.desc())
            .load::<crate::models::assinatura::Assinatura>(conn)
            .unwrap_or_default()
    };

    // Mapear para a assinatura mais recente por usuário
    use std::collections::HashMap;
    let mut latest_end: HashMap<String, chrono::DateTime<Utc>> = HashMap::new();
    for a in assinaturas_all.into_iter() {
        latest_end.entry(a.id_usuario.clone()).or_insert(a.periodo_fim);
    }

    // Mapear para a forma que o frontend espera
    let items_mapped: Vec<serde_json::Value> = items
        .into_iter()
        .map(|u| {
            let subscription_end = latest_end.get(&u.id).map(|d| d.to_string());
            serde_json::json!({
            "id": u.id,
            // frontend espera `nome` ou `usuario`
            "nome": u.nome_completo,
            "usuario": u.nome_usuario,
            "email": u.email,
            "cpf": u.cpfcnpj,
            "subscription_end": subscription_end,
            "blocked": u.blocked,
            "blocked_date": u.blocked_date.map(|d| d.to_string()),
        })
        })
        .collect();

    let resp =
        serde_json::json!({
        "items": items_mapped,
        "total": total,
        "page": page,
        "per_page": size
    });
    (StatusCode::OK, Json(resp))
}

// Block user
pub async fn block_user_handler(
    jar: CookieJar,
    axum::extract::Path(user_id): axum::extract::Path<String>
) -> impl IntoResponse {
    if validate_admin_cookie(&jar).is_none() {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message": "unauthorized"})));
    }
    let conn = &mut db::establish_connection();
    let now = chrono::Utc::now();
    let res = diesel
        ::update(usuarios_dsl::usuarios.filter(usuarios_dsl::id.eq(user_id)))
        .set((usuarios_dsl::blocked.eq(true), usuarios_dsl::blocked_date.eq(Some(now))))
        .execute(conn);
    match res {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({"message": "user blocked"}))),
        Err(e) =>
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"message": format!("error: {}", e)})),
            ),
    }
}

// Unblock user and extend subscription if possible
pub async fn unblock_user_handler(
    jar: CookieJar,
    axum::extract::Path(user_id): axum::extract::Path<String>
) -> impl IntoResponse {
    if validate_admin_cookie(&jar).is_none() {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message": "unauthorized"})));
    }
    let conn = &mut db::establish_connection();
    // load user
    if
        let Ok(_user) = usuarios_dsl::usuarios
            .filter(usuarios_dsl::id.eq(&user_id))
            .first::<Usuario>(conn)
    {
        if
            let Some(blocked_date) = {
                use crate::schema::usuarios::dsl as u_dsl;
                u_dsl::usuarios
                    .filter(u_dsl::id.eq(&user_id))
                    .select(u_dsl::blocked_date)
                    .first::<Option<chrono::DateTime<Utc>>>(conn)
                    .ok()
                    .flatten()
            }
        {
            let now = chrono::Utc::now();
          
            let duration = now.signed_duration_since(blocked_date);
            // tentar ajustar assinatura se existir
            use crate::schema::assinaturas::dsl as assin_dsl;
            if
                let Ok(mut assin) = assin_dsl::assinaturas
                    .filter(assin_dsl::id_usuario.eq(&user_id))
                    .first::<crate::models::assinatura::Assinatura>(conn)
            {
                assin.periodo_fim += duration;
                let _ = diesel
                    ::update(assin_dsl::assinaturas.filter(assin_dsl::id.eq(&assin.id)))
                    .set(assin_dsl::periodo_fim.eq(assin.periodo_fim))
                    .execute(conn);
            }
            // limpar bloqueio
            let _ = diesel
                ::update(usuarios_dsl::usuarios.filter(usuarios_dsl::id.eq(&user_id)))
                .set((
                    usuarios_dsl::blocked.eq(false),
                    usuarios_dsl::blocked_date.eq::<Option<chrono::DateTime<Utc>>>(None),
                ))
                .execute(conn);
            return (StatusCode::OK, Json(serde_json::json!({"message": "user unblocked"})));
        }
    }
    (StatusCode::BAD_REQUEST, Json(serde_json::json!({"message": "user not found or not blocked"})))
}

// Admin dashboard (skeleton): novos 30 dias, nao renovaram, taxa de renovacao
pub async fn admin_dashboard_handler(jar: CookieJar) -> impl IntoResponse {
    if validate_admin_cookie(&jar).is_none() {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message": "unauthorized"})));
    }
    let conn = &mut db::establish_connection();
    // novos 30 dias
    use crate::schema::usuarios::dsl as u_dsl;
    let inicio_30 = chrono::Utc::now() - chrono::Duration::days(30);
   
    let novos_30: i64 = u_dsl::usuarios
        .filter(
            u_dsl::criado_em.ge(
                Utc.from_utc_datetime(
                    &inicio_30.naive_utc()
                )
            )
        )
        .count()
        .first::<i64>(conn)
        .unwrap_or(0);

    // nao renovaram: heuristica -> assinaturas com periodo_fim < now
    use crate::schema::assinaturas::dsl as assin_dsl;
    let nao_renovaram: i64 = assin_dsl::assinaturas
        .filter(assin_dsl::periodo_fim.le(chrono::Utc::now()))
        .count()
        .first::<i64>(conn)
        .unwrap_or(0);

    // taxa de renovacao: clientes do mes passado vs quantos renovaram (simplificado)
    let resp =
        serde_json::json!({
        "novos_30dias": novos_30,
        "nao_renovaram": nao_renovaram,
    });
    (StatusCode::OK, Json(resp))
}

// Return basic admin info if cookie valid
pub async fn admin_me_handler(jar: CookieJar) -> impl IntoResponse {
    if validate_admin_cookie(&jar).is_none() {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message": "unauthorized"})));
    }
    // Could return more data; minimal for now
    (StatusCode::OK, Json(serde_json::json!({"role": "admin"})))
}

// Logout admin: clear cookie
pub async fn admin_logout_handler() -> impl IntoResponse {
    let mut headers = HeaderMap::new();
    // set cookie with Max-Age=0 to expire
    let cookie_value =
        "admin_auth_token=deleted; HttpOnly; Path=/; Max-Age=0; SameSite=Lax".to_string();
    headers.insert(header::SET_COOKIE, cookie_value.parse().unwrap());
    (StatusCode::OK, headers, Json(serde_json::json!({"message": "logged out"})))
}
