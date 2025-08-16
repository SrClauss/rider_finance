#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub exp: usize,
}

#[cfg(test)]
mod tests {
    // use super::*;
    // use axum::extract::Path;
    // use axum::Json;
    // use tokio;
    // Os testes devem ser reescritos para usar o padrão correto de autenticação e handlers
    // Exemplo de teste pode ser refeito aqui
    // #[tokio::test]
    // async fn test_create_and_get_transacao() { ... }
}
#[derive(Deserialize)]
pub struct UpdateTransacaoPayload {
    pub valor: Option<i32>,
    pub tipo: Option<String>,
    pub descricao: Option<String>,
    pub data: Option<chrono::NaiveDateTime>,
}

use crate::schema::transacoes;

#[derive(AsChangeset, Default)]
#[diesel(table_name = transacoes)]
pub struct TransacaoChangeset {
    pub valor: Option<i32>,
    pub tipo: Option<String>,
    pub descricao: Option<String>,
    pub data: Option<chrono::NaiveDateTime>,
}

pub async fn update_transacao_handler(Path(id_param): Path<String>, Json(payload): Json<UpdateTransacaoPayload>) -> Json<Option<TransacaoResponse>> {
    let conn = &mut db::establish_connection();
    let changeset = TransacaoChangeset {
        valor: payload.valor,
        tipo: payload.tipo,
        descricao: payload.descricao,
        data: payload.data,
    };
    diesel::update(transacoes.filter(id.eq(&id_param)))
        .set(changeset)
        .execute(conn)
        .ok();
    match transacoes.filter(id.eq(id_param)).first::<Transacao>(conn) {
        Ok(t) => Json(Some(TransacaoResponse {
            id: t.id,
            id_usuario: t.id_usuario,
            id_categoria: t.id_categoria,
            valor: t.valor,
            tipo: t.tipo,
            descricao: t.descricao,
            data: t.data,
        })),
        Err(_) => Json(None),
    }
}

pub async fn delete_transacao_handler(Path(id_param): Path<String>) -> Json<bool> {
    let conn = &mut db::establish_connection();
    let count = diesel::delete(transacoes.filter(id.eq(id_param))).execute(conn).unwrap_or(0);
    Json(count > 0)
}

use axum::{Json, extract::Path};
use axum_extra::extract::cookie::CookieJar;
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Serialize, Deserialize};
use diesel::prelude::*;
use crate::db;
use crate::schema::transacoes::dsl::*;
use crate::models::Transacao;

#[derive(Deserialize)]
pub struct CreateTransacaoPayload {
    pub id_categoria: String,
    pub valor: i32,
    pub tipo: String,
    pub descricao: Option<String>,
    pub data: Option<chrono::NaiveDateTime>,
}

#[derive(Serialize)]
#[derive(Debug)]
pub struct TransacaoResponse {
    pub id: String,
    pub id_usuario: String,
    pub id_categoria: String,
    pub valor: i32,
    pub tipo: String,
    pub descricao: Option<String>,
    pub data: chrono::NaiveDateTime,
}

pub async fn create_transacao_handler(jar: CookieJar, Json(payload): Json<CreateTransacaoPayload>) -> Json<TransacaoResponse> {
    let conn = &mut db::establish_connection();
    let now = chrono::Utc::now().naive_utc();
    let token = jar.get("auth_token").map(|c| c.value().to_string()).unwrap_or_default();
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let claims = decode::<Claims>(token.as_str(), &DecodingKey::from_secret(secret.as_ref()), &Validation::default())
        .map(|token_data| token_data.claims)
        .unwrap_or_else(|_| Claims { sub: "".to_string(), email: "".to_string(), exp: 0 });
    let user_id = claims.sub.clone();
    let nova_data = payload.data.unwrap_or(now);
    let nova_transacao = crate::models::NewTransacao {
        id: ulid::Ulid::new().to_string(),
        id_usuario: user_id.clone(),
        id_categoria: payload.id_categoria,
        valor: payload.valor,
        tipo: payload.tipo,
        descricao: payload.descricao,
        data: nova_data,
        origem: None,
        id_externo: None,
        plataforma: None,
        observacoes: None,
        tags: None,
        criado_em: now,
        atualizado_em: now,
    };
    diesel::insert_into(transacoes)
        .values(&nova_transacao)
        .execute(conn)
        .expect("Erro ao inserir transação");
    Json(TransacaoResponse {
        id: nova_transacao.id,
        id_usuario: nova_transacao.id_usuario,
        id_categoria: nova_transacao.id_categoria,
        valor: nova_transacao.valor,
        tipo: nova_transacao.tipo,
        descricao: nova_transacao.descricao,
        data: nova_transacao.data,
    })
}

pub async fn get_transacao_handler(Path(id_param): Path<String>) -> Json<Option<TransacaoResponse>> {
    let conn = &mut db::establish_connection();
    match transacoes.filter(id.eq(id_param)).first::<Transacao>(conn) {
        Ok(t) => Json(Some(TransacaoResponse {
            id: t.id,
            id_usuario: t.id_usuario,
            id_categoria: t.id_categoria,
            valor: t.valor,
            tipo: t.tipo,
            descricao: t.descricao,
            data: t.data,
        })),
        Err(_) => Json(None),
    }
}


#[derive(Deserialize, Debug)]
pub struct TransacaoFiltro {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
    pub id_categoria: Option<String>,
    pub descricao: Option<String>,
    pub tipo: Option<String>,
    pub data_inicio: Option<chrono::NaiveDateTime>,
    pub data_fim: Option<chrono::NaiveDateTime>,
}

#[derive(Serialize)]
pub struct PaginatedTransacoes {
    pub total: usize,
    pub page: usize,
    pub page_size: usize,
    pub items: Vec<TransacaoResponse>,
}

pub async fn list_transacoes_handler(
    jar: CookieJar,
    Json(filtro): Json<TransacaoFiltro>,
) -> Json<PaginatedTransacoes> {
    // (nenhum import extra necessário)
    let conn = &mut db::establish_connection();
    let token = jar.get("auth_token").map(|c| c.value().to_string()).unwrap_or_default();
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let claims = decode::<Claims>(token.as_str(), &DecodingKey::from_secret(secret.as_ref()), &Validation::default())
        .map(|token_data| token_data.claims)
        .unwrap_or_else(|_| Claims { sub: "".to_string(), email: "".to_string(), exp: 0 });
    let user_id = claims.sub.clone();

    let page = filtro.page.unwrap_or(1).max(1);
    let page_size = filtro.page_size.unwrap_or(10).clamp(1, 100);
    let offset = (page - 1) * page_size;

    // Monta query base para count
    let mut count_query = transacoes.filter(id_usuario.eq(&user_id)).into_boxed();
    if let Some(ref cat) = filtro.id_categoria {
        count_query = count_query.filter(id_categoria.eq(cat));
    }
    if let Some(ref desc) = filtro.descricao {
        count_query = count_query.filter(descricao.ilike(format!("%{}%", desc)));
    }
    if let Some(ref tipo_f) = filtro.tipo {
        count_query = count_query.filter(tipo.eq(tipo_f));
    }
    if let (Some(dt_ini), Some(dt_fim)) = (filtro.data_inicio, filtro.data_fim) {
        count_query = count_query.filter(data.ge(dt_ini).and(data.le(dt_fim)));
    } else if let Some(dt_ini) = filtro.data_inicio {
        count_query = count_query.filter(data.ge(dt_ini));
    } else if let Some(dt_fim) = filtro.data_fim {
        count_query = count_query.filter(data.le(dt_fim));
    }

    let total: i64 = count_query.count().get_result(conn).unwrap_or(0);

    // Monta query base para busca paginada
    let mut data_query = transacoes.filter(id_usuario.eq(&user_id)).into_boxed();
    if let Some(ref cat) = filtro.id_categoria {
        data_query = data_query.filter(id_categoria.eq(cat));
    }
    if let Some(ref desc) = filtro.descricao {
        data_query = data_query.filter(descricao.ilike(format!("%{}%", desc)));
    }
    if let Some(ref tipo_f) = filtro.tipo {
        data_query = data_query.filter(tipo.eq(tipo_f));
    }
    if let (Some(dt_ini), Some(dt_fim)) = (filtro.data_inicio, filtro.data_fim) {
        data_query = data_query.filter(data.ge(dt_ini).and(data.le(dt_fim)));
    } else if let Some(dt_ini) = filtro.data_inicio {
        data_query = data_query.filter(data.ge(dt_ini));
    } else if let Some(dt_fim) = filtro.data_fim {
        data_query = data_query.filter(data.le(dt_fim));
    }

    let results = data_query
        .order(data.desc())
        .limit(page_size as i64)
        .offset(offset as i64)
        .load::<Transacao>(conn)
        .unwrap_or_default();

    let items = results.into_iter().map(|t| TransacaoResponse {
        id: t.id,
        id_usuario: t.id_usuario,
        id_categoria: t.id_categoria,
        valor: t.valor,
        tipo: t.tipo,
        descricao: t.descricao,
        data: t.data,
    }).collect();

    Json(PaginatedTransacoes {
        total: total as usize,
        page,
        page_size,
        items,
    })
}
