use axum::{Json};
use axum_extra::extract::cookie::CookieJar;
use crate::services::auth::login::extract_active_user_id_from_cookie;
use crate::models::{Meta, Transacao};
use diesel::pg::PgConnection;
use diesel::prelude::*;
use chrono::NaiveDateTime;
use serde::Serialize;

#[derive(Serialize)]
pub struct MetasComTransacoes {
    pub metas: Vec<Meta>,
    pub transacoes: Vec<Transacao>,
}

pub async fn metas_ativas_com_transacoes_handler(
    jar: CookieJar,
) -> Result<Json<serde_json::Value>, (axum::http::StatusCode, String)> {
    let usuario_id = extract_active_user_id_from_cookie(&jar).ok_or((axum::http::StatusCode::UNAUTHORIZED, "Token inválido ou ausente".to_string()))?;
    let mut conn = crate::db::establish_connection();
    let result = buscar_metas_ativas_com_transacoes(&mut conn, &usuario_id)
    .map_err(|e| (axum::http::StatusCode::INTERNAL_SERVER_ERROR, format!("Erro ao buscar metas/transações: {e}")))?;
    Ok(Json(serde_json::json!({
        "metas": result.metas,
        "transacoes": result.transacoes
    })))
}

pub fn buscar_metas_ativas_com_transacoes(conn: &mut PgConnection, usuario_id: &str) -> Result<MetasComTransacoes, diesel::result::Error> {
    use crate::schema::metas::dsl as metas_dsl;
    use crate::schema::transacoes::dsl as trans_dsl;

    // Busca todas as metas ativas do usuário
    let metas_ativas: Vec<Meta> = metas_dsl::metas
        .filter(metas_dsl::id_usuario.eq(usuario_id))
        .filter(metas_dsl::eh_ativa.eq(true))
        .load::<Meta>(conn)?;

    // Se não houver metas ativas, não retorna nenhuma transação
    if metas_ativas.is_empty() {
        return Ok(MetasComTransacoes {
            metas: vec![],
            transacoes: vec![],
        });
    }

    // Descobre o maior intervalo de datas das metas ativas
    let (min_inicio, max_fim) = {
        let mut min: Option<NaiveDateTime> = None;
        let mut max: Option<NaiveDateTime> = None;
        for meta in &metas_ativas {
            if min.is_none() || meta.data_inicio < min.unwrap() {
                min = Some(meta.data_inicio);
            }
            if let Some(df) = meta.data_fim {
                if max.is_none() || df > max.unwrap() {
                    max = Some(df);
                }
            }
        }
        (min, max)
    };

    // Busca todas as transações do usuário que estejam no intervalo de qualquer meta ativa
    let mut query = trans_dsl::transacoes
        .filter(trans_dsl::id_usuario.eq(usuario_id))
        .into_boxed();
    if let Some(min_inicio) = min_inicio {
        query = query.filter(trans_dsl::data.ge(min_inicio));
    }
    if let Some(max_fim) = max_fim {
        query = query.filter(trans_dsl::data.le(max_fim));
    }
    let transacoes: Vec<Transacao> = query.order(trans_dsl::data.asc()).load::<Transacao>(conn)?;

    Ok(MetasComTransacoes {
        metas: metas_ativas,
        transacoes,
    })
}
