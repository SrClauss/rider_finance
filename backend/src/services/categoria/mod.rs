use axum_extra::extract::cookie::CookieJar;
use jsonwebtoken::{decode, DecodingKey, Validation};
use crate::services::dashboard::Claims;
use axum::{Json, extract::Path};
use diesel::prelude::*;
use serde::{Serialize, Deserialize};
use crate::db;
use crate::schema::categorias::dsl::*;
use crate::models::{Categoria, NewCategoria};
use chrono::NaiveDateTime;
use crate::schema::transacoes::dsl as trans_dsl;

#[derive(Deserialize)]
pub struct CreateCategoriaPayload {
    pub id_usuario: Option<String>,
    pub nome: String,
    pub tipo: String,
    pub icone: Option<String>,
    pub cor: Option<String>,
}

#[derive(Serialize)]
pub struct CategoriaResponse {
    pub id: String,
    pub id_usuario: Option<String>,
    pub nome: String,
    pub tipo: String,
    pub icone: Option<String>,
    pub cor: Option<String>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}
pub async fn list_categorias_autenticado_handler(jar: CookieJar) -> Json<Vec<CategoriaResponse>> {
    // Extrai token do cookie
    let token = jar.get("auth_token").map(|c| c.value().to_string()).unwrap_or_default();
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let claims = decode::<Claims>(token.as_str(), &DecodingKey::from_secret(secret.as_ref()), &Validation::default())
        .map(|data| data.claims)
        .unwrap_or_else(|_| Claims { sub: "".to_string(), email: "".to_string(), exp: 0 });
    let usuario_id_val = claims.sub.clone();
    if usuario_id_val.is_empty() {
        return Json(vec![]);
    }
    let conn = &mut db::establish_connection();
    let results = categorias
        .filter(id_usuario.eq(usuario_id_val.clone()))
        .order(nome.asc())
        .load::<Categoria>(conn)
        .unwrap_or_default();
    Json(results.into_iter().map(|c| CategoriaResponse {
        id: c.id,
        id_usuario: c.id_usuario,
        nome: c.nome,
        tipo: c.tipo,
        icone: c.icone,
        cor: c.cor,
        criado_em: c.criado_em,
        atualizado_em: c.atualizado_em,
    }).collect())
}

// Internal function to create category (used by seed/tests/internal calls)
pub async fn create_categoria_internal(Json(payload): Json<CreateCategoriaPayload>) -> Json<CategoriaResponse> {
    let conn = &mut db::establish_connection();
    let now = chrono::Utc::now().naive_utc();
    let nova_categoria = NewCategoria {
        id: ulid::Ulid::new().to_string(),
        id_usuario: payload.id_usuario,
        nome: payload.nome,
        tipo: payload.tipo,
        icone: payload.icone,
        cor: payload.cor,
        criado_em: now,
        atualizado_em: now,
    };
    diesel::insert_into(categorias)
        .values(&nova_categoria)
        .execute(conn)
        .expect("Erro ao inserir categoria");
    Json(CategoriaResponse {
        id: nova_categoria.id,
        id_usuario: nova_categoria.id_usuario,
        nome: nova_categoria.nome,
        tipo: nova_categoria.tipo,
        icone: nova_categoria.icone,
        cor: nova_categoria.cor,
        criado_em: nova_categoria.criado_em,
        atualizado_em: nova_categoria.atualizado_em,
    })
}

// HTTP handler: extract user id from http-only cookie (auth_token) and assign to created category
pub async fn create_categoria_handler(jar: CookieJar, Json(payload): Json<CreateCategoriaPayload>) -> Json<CategoriaResponse> {
    // Try to extract token from cookie
    let token = jar.get("auth_token").map(|c| c.value().to_string()).unwrap_or_default();
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let claims = decode::<Claims>(token.as_str(), &DecodingKey::from_secret(secret.as_ref()), &Validation::default())
        .map(|data| data.claims)
        .unwrap_or_else(|_| Claims { sub: "".to_string(), email: "".to_string(), exp: 0 });
    let usuario_id_val = if claims.sub.is_empty() { payload.id_usuario.clone() } else { Some(claims.sub.clone()) };

    // Reuse internal creation logic but with overridden id_usuario when present
    let conn = &mut db::establish_connection();
    let now = chrono::Utc::now().naive_utc();
    let nova_categoria = NewCategoria {
        id: ulid::Ulid::new().to_string(),
        id_usuario: usuario_id_val,
        nome: payload.nome,
        tipo: payload.tipo,
        icone: payload.icone,
        cor: payload.cor,
        criado_em: now,
        atualizado_em: now,
    };
    diesel::insert_into(categorias)
        .values(&nova_categoria)
        .execute(conn)
        .expect("Erro ao inserir categoria");
    Json(CategoriaResponse {
        id: nova_categoria.id,
        id_usuario: nova_categoria.id_usuario,
        nome: nova_categoria.nome,
        tipo: nova_categoria.tipo,
        icone: nova_categoria.icone,
        cor: nova_categoria.cor,
        criado_em: nova_categoria.criado_em,
        atualizado_em: nova_categoria.atualizado_em,
    })
}

pub async fn get_categoria_handler(Path(id_param): Path<String>) -> Json<Option<CategoriaResponse>> {
    let conn = &mut db::establish_connection();
    match categorias.filter(id.eq(id_param)).first::<Categoria>(conn) {
        Ok(c) => Json(Some(CategoriaResponse {
            id: c.id,
            id_usuario: c.id_usuario,
            nome: c.nome,
            tipo: c.tipo,
            icone: c.icone,
            cor: c.cor,
            criado_em: c.criado_em,
            atualizado_em: c.atualizado_em,
        })),
        Err(_) => Json(None),
    }
}

pub async fn delete_categoria_handler(Path(id_param): Path<String>) -> Json<bool> {
    let conn = &mut db::establish_connection();
    // Prevent deletion of reserved categories by name (if they belong to user)
    // Try to fetch category and if its name is reserved, disallow
    if let Ok(Some(cat)) = categorias.filter(id.eq(&id_param)).first::<Categoria>(conn).optional() {
        if cat.nome == "Corrida Uber" || cat.nome == "Corrida 99" {
            return Json(false);
        }
    }
    let count = diesel::delete(categorias.filter(id.eq(id_param))).execute(conn).unwrap_or(0);
    Json(count > 0)
}

#[derive(Deserialize)]
pub struct UpdateCategoriaPayload {
    pub nome: Option<String>,
    pub tipo: Option<String>,
    pub icone: Option<String>,
    pub cor: Option<String>,
}

pub async fn update_categoria_handler(Path(id_param): Path<String>, jar: axum_extra::extract::cookie::CookieJar, Json(payload): Json<UpdateCategoriaPayload>) -> Json<Option<CategoriaResponse>> {
    // extrai usuário do cookie
    let token = jar.get("auth_token").map(|c| c.value().to_string()).unwrap_or_default();
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let claims = jsonwebtoken::decode::<crate::services::dashboard::Claims>(token.as_str(), &jsonwebtoken::DecodingKey::from_secret(secret.as_ref()), &jsonwebtoken::Validation::default())
        .map(|data| data.claims)
        .unwrap_or_else(|_| crate::services::dashboard::Claims { sub: "".to_string(), email: "".to_string(), exp: 0 });
    let usuario_id_val = claims.sub.clone();

    if usuario_id_val.is_empty() {
        return Json(None);
    }

    let conn = &mut db::establish_connection();

    // Verify exists
    match categorias.filter(id.eq(&id_param)).filter(id_usuario.eq(Some(usuario_id_val.clone()))).first::<Categoria>(conn).optional() {
        Ok(Some(existing)) => {
            // prepare updated values
            let new_nome = payload.nome.unwrap_or(existing.nome);
            let new_tipo = payload.tipo.unwrap_or(existing.tipo);
            let new_icone = payload.icone.or(existing.icone);
            let new_cor = payload.cor.or(existing.cor);

            // Execute update via explicit set of columns
            let res = diesel::update(categorias.filter(id.eq(&id_param)).filter(id_usuario.eq(Some(usuario_id_val.clone()))))
                .set((nome.eq(&new_nome), tipo.eq(&new_tipo), icone.eq(&new_icone), cor.eq(&new_cor), atualizado_em.eq(chrono::Utc::now().naive_utc())))
                .execute(conn);

            if res.is_err() {
                return Json(None);
            }

            // Return updated
            match categorias.filter(id.eq(&id_param)).first::<Categoria>(conn) {
                Ok(c) => Json(Some(CategoriaResponse { id: c.id, id_usuario: c.id_usuario, nome: c.nome, tipo: c.tipo, icone: c.icone, cor: c.cor, criado_em: c.criado_em, atualizado_em: c.atualizado_em })),
                Err(_) => Json(None),
            }
        }
        _ => Json(None),
    }
}

#[derive(Serialize)]
pub struct PreviewDeleteResponse {
    pub transactions_count: i64,
}

pub async fn preview_delete_categoria_handler(Path(id_param): Path<String>, jar: axum_extra::extract::cookie::CookieJar) -> Json<PreviewDeleteResponse> {
    // Extrai usuário do cookie
    let token = jar.get("auth_token").map(|c| c.value().to_string()).unwrap_or_default();
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let claims = jsonwebtoken::decode::<crate::services::dashboard::Claims>(token.as_str(), &jsonwebtoken::DecodingKey::from_secret(secret.as_ref()), &jsonwebtoken::Validation::default())
        .map(|data| data.claims)
        .unwrap_or_else(|_| crate::services::dashboard::Claims { sub: "".to_string(), email: "".to_string(), exp: 0 });
    let usuario_id_val = claims.sub.clone();
    let conn = &mut db::establish_connection();

    // Conta transações pertencentes a esse usuário e à categoria informada
    let count: i64 = trans_dsl::transacoes
        .filter(trans_dsl::id_categoria.eq(id_param))
        .filter(trans_dsl::id_usuario.eq(usuario_id_val))
        .count()
        .get_result(conn)
        .unwrap_or(0);

    Json(PreviewDeleteResponse { transactions_count: count })
}

#[derive(Deserialize)]
pub struct ExecuteDeletePayload {
    pub method: String, // "migrate" or "delete"
    pub target_id: Option<String>,
}

#[derive(Serialize)]
pub struct ExecuteDeleteResponse {
    pub migrated_count: i64,
    pub deleted_transactions_count: i64,
    pub deleted_category: bool,
}

pub async fn execute_delete_categoria_handler(Path(id_param): Path<String>, jar: axum_extra::extract::cookie::CookieJar, Json(payload): Json<ExecuteDeletePayload>) -> Json<ExecuteDeleteResponse> {
    let conn = &mut db::establish_connection();

    // Extrai usuário do cookie
    let token = jar.get("auth_token").map(|c| c.value().to_string()).unwrap_or_default();
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let claims = jsonwebtoken::decode::<crate::services::dashboard::Claims>(token.as_str(), &jsonwebtoken::DecodingKey::from_secret(secret.as_ref()), &jsonwebtoken::Validation::default())
        .map(|data| data.claims)
        .unwrap_or_else(|_| crate::services::dashboard::Claims { sub: "".to_string(), email: "".to_string(), exp: 0 });
    let usuario_id_val = claims.sub.clone();

    // Garante que operamos apenas nas categorias do usuário
    // Usa transação para garantir atomicidade
    let result = conn.transaction::<(i64,i64,bool), diesel::result::Error, _>(|conn_inner| {
        if payload.method == "migrate" {
            let target = match payload.target_id {
                Some(ref t) if t != &id_param => t.clone(),
                _ => return Err(diesel::result::Error::RollbackTransaction),
            };

            // Verifica que target pertence ao usuário
            let target_exists = categorias.filter(id.eq(&target)).filter(id_usuario.eq(Some(usuario_id_val.clone()))).first::<Categoria>(conn_inner).optional()?;
            if target_exists.is_none() {
                return Err(diesel::result::Error::RollbackTransaction);
            }
            // Disallow migrating from reserved categories
            if let Ok(Some(orig_cat)) = categorias.filter(id.eq(&id_param)).first::<Categoria>(conn_inner).optional() {
                if orig_cat.nome == "Corrida Uber" || orig_cat.nome == "Corrida 99" {
                    return Err(diesel::result::Error::RollbackTransaction);
                }
            }

            let migrated = diesel::update(trans_dsl::transacoes.filter(trans_dsl::id_categoria.eq(&id_param)).filter(trans_dsl::id_usuario.eq(&usuario_id_val)))
                .set(trans_dsl::id_categoria.eq(target))
                .execute(conn_inner)?;

            let deleted_cat = diesel::delete(categorias.filter(id.eq(&id_param)).filter(id_usuario.eq(Some(usuario_id_val.clone())))).execute(conn_inner)?;
            Ok((migrated as i64, 0i64, deleted_cat > 0))
        } else {
            // delete transactions then category
            // Disallow deleting reserved categories
            if let Ok(Some(orig_cat)) = categorias.filter(id.eq(&id_param)).first::<Categoria>(conn_inner).optional() {
                if orig_cat.nome == "Corrida Uber" || orig_cat.nome == "Corrida 99" {
                    return Err(diesel::result::Error::RollbackTransaction);
                }
            }
            let deleted_tx = diesel::delete(trans_dsl::transacoes.filter(trans_dsl::id_categoria.eq(&id_param)).filter(trans_dsl::id_usuario.eq(&usuario_id_val))).execute(conn_inner)?;
            let deleted_cat = diesel::delete(categorias.filter(id.eq(&id_param)).filter(id_usuario.eq(Some(usuario_id_val.clone())))).execute(conn_inner)?;
            Ok((0i64, deleted_tx as i64, deleted_cat > 0))
        }
    });

    match result {
        Ok((migrated, deleted_tx, deleted_cat)) => Json(ExecuteDeleteResponse { migrated_count: migrated, deleted_transactions_count: deleted_tx, deleted_category: deleted_cat }),
        Err(_) => Json(ExecuteDeleteResponse { migrated_count: 0, deleted_transactions_count: 0, deleted_category: false }),
    }
}
