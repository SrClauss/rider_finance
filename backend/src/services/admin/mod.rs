use axum::{Json, response::IntoResponse};
use axum::http::StatusCode;
use serde::{Deserialize, Serialize};
use crate::db;
use crate::models::{Admin, Usuario};
use crate::schema::admins::dsl as admin_dsl;
use crate::schema::usuarios::dsl as usuarios_dsl;
use diesel::prelude::*;

#[derive(Deserialize)]
pub struct AdminLoginPayload {
    pub username: String,
    pub password: String,
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
    match admin_dsl::admins.filter(admin_dsl::username.eq(&payload.username)).first::<Admin>(conn) {
        Ok(admin) => {
            if bcrypt::verify(&payload.password, &admin.password_hash).unwrap_or(false) {
                // Para simplicidade, retornamos OK (token admin pode ser implementado depois)
                let resp = serde_json::json!({"message": "admin authenticated"});
                (StatusCode::OK, Json(resp))
            } else {
                (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message": "invalid credentials"})))
            }
        },
        Err(_) => (StatusCode::UNAUTHORIZED, Json(serde_json::json!({"message": "invalid credentials"}))),
    }
}

// Change password (basic): verifies old password and updates hash
pub async fn admin_change_password_handler(Json(payload): Json<ChangePasswordPayload>) -> impl IntoResponse {
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
    pub name: Option<String>,
    pub cpf: Option<String>,
    pub blocked: Option<bool>,
}

pub async fn list_users_handler(axum::extract::Query(q): axum::extract::Query<ListUsersQuery>) -> impl IntoResponse {
    let conn = &mut db::establish_connection();
    let page = q.page.unwrap_or(1).max(1);
    let size = q.size.unwrap_or(20).clamp(1,100);
    let offset = (page - 1) * size;

    let mut base = usuarios_dsl::usuarios.into_boxed();
    if let Some(ref name) = q.name {
    base = base.filter(usuarios_dsl::nome_completo.ilike(format!("%{name}%")));
    }
    if let Some(ref cpf) = q.cpf {
        let cpf_norm = cpf.replace(['.', '-'], "");
    base = base.filter(usuarios_dsl::cpfcnpj.ilike(format!("%{cpf_norm}%")));
    }
    if let Some(blocked_flag) = q.blocked {
        base = base.filter(usuarios_dsl::blocked.eq(blocked_flag));
    }

    // Recriar query para contagem (não podemos clonar BoxedSelectStatement)
    let mut count_q = usuarios_dsl::usuarios.into_boxed();
    if let Some(ref name) = &q.name {
    count_q = count_q.filter(usuarios_dsl::nome_completo.ilike(format!("%{name}%")));
    }
    if let Some(ref cpf) = &q.cpf {
        let cpf_norm = cpf.replace(['.', '-'], "");
    count_q = count_q.filter(usuarios_dsl::cpfcnpj.ilike(format!("%{cpf_norm}%")));
    }
    if let Some(blocked_flag) = q.blocked {
        count_q = count_q.filter(usuarios_dsl::blocked.eq(blocked_flag));
    }
    let total = count_q.count().get_result::<i64>(conn).unwrap_or(0);
    let items = base.offset(offset).limit(size).load::<Usuario>(conn).unwrap_or_default();

    let resp = PaginatedUsers { items, total, page, size };
    (StatusCode::OK, Json(resp))
}

// Block user
pub async fn block_user_handler(axum::extract::Path(user_id): axum::extract::Path<String>) -> impl IntoResponse {
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
pub async fn unblock_user_handler(axum::extract::Path(user_id): axum::extract::Path<String>) -> impl IntoResponse {
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
pub async fn admin_dashboard_handler() -> impl IntoResponse {
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
