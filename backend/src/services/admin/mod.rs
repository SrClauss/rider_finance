use axum::{Json, response::IntoResponse};
use axum::http::{StatusCode, HeaderMap, header};
use axum_extra::extract::cookie::CookieJar;
use crate::db;
use crate::models::{Admin, Usuario};
use crate::schema::admins::dsl as admin_dsl;
use crate::schema::usuarios::dsl as usuarios_dsl;
use diesel::prelude::*;
use jsonwebtoken::{encode, decode, Header, EncodingKey, DecodingKey, Validation, Algorithm};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct AdminLoginPayload {
    pub usuario: String,
    pub senha: String,
}

#[derive(Deserialize)]
pub struct ChangePasswordPayload {
    pub username: String,
    pub old_password: String,
    pub new_password: String,
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
    match admin_dsl::admins.filter(admin_dsl::username.eq(&payload.usuario)).first::<Admin>(conn) {
        Ok(admin) => {
                if bcrypt::verify(&payload.senha, &admin.password_hash).unwrap_or(false) {
                // Gera token JWT para admin e seta cookie HttpOnly com nome diferente do token de usuário
                // Payload mínimo: sub = admin.id
                #[derive(Serialize, Deserialize)]
                struct Claims { sub: String, exp: usize }
                let expiration = chrono::Utc::now().timestamp() as usize + 60 * 60 * 24; // 24h
                let claims = Claims { sub: admin.id.clone(), exp: expiration };
                let secret = std::env::var("ADMIN_JWT_SECRET").unwrap_or_else(|_| std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string()));
                match encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_ref())) {
                    Ok(token) => {
                        let mut headers = HeaderMap::new();
                        let cookie_value = format!("admin_auth_token={token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax");
                        headers.insert(header::SET_COOKIE, cookie_value.parse().unwrap());
                        let resp = serde_json::json!({"message": format!("admin authenticated: {}", admin.username)});
                        (StatusCode::OK, headers, Json(resp))
                    },
                    Err(_) => {
                        let headers = HeaderMap::new();
                        (StatusCode::INTERNAL_SERVER_ERROR, headers, Json(serde_json::json!({"message": "failed to generate token"})))
                    },
                }
                } else {
                    let headers = HeaderMap::new();
                    (StatusCode::UNAUTHORIZED, headers, Json(serde_json::json!({"message": "invalid credentials"})))
                }
        },
        Err(_) => {
            let headers = HeaderMap::new();
            (StatusCode::UNAUTHORIZED, headers, Json(serde_json::json!({"message": "invalid credentials"})))
        },
    }
}

// Change password (basic): verifies old password and updates hash
fn validate_admin_cookie(jar: &CookieJar) -> bool {
    if let Some(cookie) = jar.get("admin_auth_token") {
        let token = cookie.value();
        let secret = std::env::var("ADMIN_JWT_SECRET").unwrap_or_else(|_| std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string()));
        let validation = Validation::new(Algorithm::HS256);
        return decode::<serde_json::Value>(token, &DecodingKey::from_secret(secret.as_ref()), &validation).is_ok();
    }
    false
}

pub async fn admin_change_password_handler(jar: CookieJar, Json(payload): Json<ChangePasswordPayload>) -> impl IntoResponse {
    if !validate_admin_cookie(&jar) {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message": "unauthorized"}))); 
    }
    let conn = &mut db::establish_connection();
    if let Ok(admin) = admin_dsl::admins.filter(admin_dsl::username.eq(&payload.username)).first::<Admin>(conn) {
        if bcrypt::verify(&payload.old_password, &admin.password_hash).unwrap_or(false) {
            let new_hash = bcrypt::hash(&payload.new_password, bcrypt::DEFAULT_COST).unwrap();
            let _ = diesel::update(admin_dsl::admins.filter(admin_dsl::id.eq(&admin.id)))
                .set((admin_dsl::password_hash.eq(new_hash), admin_dsl::atualizado_em.eq(chrono::Utc::now().naive_utc())))
                .execute(conn);
            return (StatusCode::OK, Json(serde_json::json!({"message": "password changed"})));
        }
    }
    (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message": "invalid credentials"})))
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
pub async fn list_users_handler(jar: CookieJar, axum::extract::Query(query): axum::extract::Query<ListUsersQuery>) -> impl IntoResponse {
    // Handler exige cookie admin_auth_token
    if !validate_admin_cookie(&jar) {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message": "unauthorized"}))); 
    }
    let conn = &mut db::establish_connection();
    let page = query.page.unwrap_or(1).max(1);
    let size = query.size.unwrap_or(20).clamp(1,100);
    let offset = (page - 1) * size;

    let mut base = usuarios_dsl::usuarios.into_boxed();
    // pesquisa por nome: aceitar tanto `q` quanto `name` e procurar em nome_completo OU nome_usuario
    if let Some(ref s) = query.q.as_ref().or(query.name.as_ref()) {
        let pattern = format!("%{}%", s);
        base = base.filter(usuarios_dsl::nome_completo.ilike(pattern.clone()).or(usuarios_dsl::nome_usuario.ilike(pattern)));
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
        let pattern = format!("%{}%", s);
        count_q = count_q.filter(usuarios_dsl::nome_completo.ilike(pattern.clone()).or(usuarios_dsl::nome_usuario.ilike(pattern)));
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
    let user_ids: Vec<String> = items.iter().map(|u| u.id.clone()).collect();
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
    let mut latest_end: HashMap<String, chrono::NaiveDateTime> = HashMap::new();
    for a in assinaturas_all.into_iter() {
        latest_end.entry(a.id_usuario.clone()).or_insert(a.periodo_fim);
    }

    // Mapear para a forma que o frontend espera
    let items_mapped: Vec<serde_json::Value> = items.into_iter().map(|u| {
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
    }).collect();

    let resp = serde_json::json!({
        "items": items_mapped,
        "total": total,
        "page": page,
        "per_page": size
    });
    (StatusCode::OK, Json(resp))
}

// Block user
pub async fn block_user_handler(jar: CookieJar, axum::extract::Path(user_id): axum::extract::Path<String>) -> impl IntoResponse {
    if !validate_admin_cookie(&jar) {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message": "unauthorized"}))); 
    }
    let conn = &mut db::establish_connection();
    let now = chrono::Utc::now().naive_utc();
    let res = diesel::update(usuarios_dsl::usuarios.filter(usuarios_dsl::id.eq(user_id)))
        .set((usuarios_dsl::blocked.eq(true), usuarios_dsl::blocked_date.eq(Some(now))))
        .execute(conn);
    match res {
        Ok(_) => (StatusCode::OK, Json(serde_json::json!({"message": "user blocked"}))),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({"message": format!("error: {}", e)})))
    }
}

// Unblock user and extend subscription if possible
pub async fn unblock_user_handler(jar: CookieJar, axum::extract::Path(user_id): axum::extract::Path<String>) -> impl IntoResponse {
    if !validate_admin_cookie(&jar) {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message": "unauthorized"}))); 
    }
    let conn = &mut db::establish_connection();
    // load user
    if let Ok(_user) = usuarios_dsl::usuarios.filter(usuarios_dsl::id.eq(&user_id)).first::<Usuario>(conn) {   
        if let Some(blocked_date) = {
            use crate::schema::usuarios::dsl as u_dsl;
            u_dsl::usuarios.filter(u_dsl::id.eq(&user_id)).select(u_dsl::blocked_date).first::<Option<chrono::NaiveDateTime>>(conn).ok().flatten()
        } {
            let now = chrono::Utc::now().naive_utc();
            let duration = now.signed_duration_since(blocked_date);
            // tentar ajustar assinatura se existir
            use crate::schema::assinaturas::dsl as assin_dsl;
            if let Ok(mut assin) = assin_dsl::assinaturas.filter(assin_dsl::id_usuario.eq(&user_id)).first::<crate::models::assinatura::Assinatura>(conn) {
                assin.periodo_fim += duration;
                let _ = diesel::update(assin_dsl::assinaturas.filter(assin_dsl::id.eq(&assin.id)))
                    .set(assin_dsl::periodo_fim.eq(assin.periodo_fim))
                    .execute(conn);
            }
            // limpar bloqueio
            let _ = diesel::update(usuarios_dsl::usuarios.filter(usuarios_dsl::id.eq(&user_id)))
                .set((usuarios_dsl::blocked.eq(false), usuarios_dsl::blocked_date.eq::<Option<chrono::NaiveDateTime>>(None)))
                .execute(conn);
            return (StatusCode::OK, Json(serde_json::json!({"message": "user unblocked"})))
        }
    }
    (StatusCode::BAD_REQUEST, Json(serde_json::json!({"message": "user not found or not blocked"})))
}

// Admin dashboard (skeleton): novos 30 dias, nao renovaram, taxa de renovacao
pub async fn admin_dashboard_handler(jar: CookieJar) -> impl IntoResponse {
    if !validate_admin_cookie(&jar) {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message": "unauthorized"}))); 
    }
    let conn = &mut db::establish_connection();
    // novos 30 dias
    use crate::schema::usuarios::dsl as u_dsl;
    let _hoje = chrono::Utc::now().naive_utc().date();
    let inicio_30 = (chrono::Utc::now().naive_utc() - chrono::Duration::days(30)).date();
    let novos_30: i64 = u_dsl::usuarios.filter(u_dsl::criado_em.ge(chrono::NaiveDateTime::new(inicio_30, chrono::NaiveTime::from_hms_opt(0,0,0).unwrap())))
        .count().first::<i64>(conn).unwrap_or(0);

    // nao renovaram: heuristica -> assinaturas com periodo_fim < now
    use crate::schema::assinaturas::dsl as assin_dsl;
    let nao_renovaram: i64 = assin_dsl::assinaturas.filter(assin_dsl::periodo_fim.le(chrono::Utc::now().naive_utc())).count().first::<i64>(conn).unwrap_or(0);

    // taxa de renovacao: clientes do mes passado vs quantos renovaram (simplificado)
    let resp = serde_json::json!({
        "novos_30dias": novos_30,
        "nao_renovaram": nao_renovaram,
    });
    (StatusCode::OK, Json(resp))
}

// Return basic admin info if cookie valid
pub async fn admin_me_handler(jar: CookieJar) -> impl IntoResponse {
    if !validate_admin_cookie(&jar) {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message": "unauthorized"}))); 
    }
    // Could return more data; minimal for now
    (StatusCode::OK, Json(serde_json::json!({"role": "admin"})))
}

// Logout admin: clear cookie
pub async fn admin_logout_handler() -> impl IntoResponse {
    let mut headers = HeaderMap::new();
    // set cookie with Max-Age=0 to expire
    let cookie_value = "admin_auth_token=deleted; HttpOnly; Path=/; Max-Age=0; SameSite=Lax".to_string();
    headers.insert(header::SET_COOKIE, cookie_value.parse().unwrap());
    (StatusCode::OK, headers, Json(serde_json::json!({"message": "logged out"})))
}
