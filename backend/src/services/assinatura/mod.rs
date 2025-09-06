pub mod checkout;
use axum::Json;
use diesel::{ExpressionMethods, OptionalExtension, QueryDsl, RunQueryDsl};
use crate::models::assinatura::{Assinatura, NewAssinatura};
use crate::db;
use crate::schema::assinaturas::dsl::{assinaturas, id as assinatura_id, periodo_inicio, periodo_fim, atualizado_em as assinatura_atualizado_em, id_usuario as assinatura_id_usuario};
use chrono::{Utc, Duration};
use ulid::Ulid;

pub async fn create_assinatura(
    payload: Json<NewAssinatura>,
) -> Json<Assinatura> {
    let mut conn = db::establish_connection();
    let new_assinatura = NewAssinatura {
    id: Ulid::new().to_string(),
        id_usuario: payload.id_usuario.clone(),
        asaas_subscription_id: payload.asaas_subscription_id.clone(),
        periodo_inicio: payload.periodo_inicio,
        periodo_fim: payload.periodo_fim,
        criado_em: payload.criado_em,
        atualizado_em: payload.atualizado_em,
    };
    let inserted_assinatura: Assinatura = diesel::insert_into(crate::schema::assinaturas::dsl::assinaturas)
        .values(&new_assinatura)
        .get_result(&mut conn)
        .expect("Erro ao inserir assinatura");
    Json(inserted_assinatura)
}


pub async fn get_assinatura_by_usuario_handler(
    Json(usuario_id_payload): Json<String>,
) -> Json<Option<Assinatura>> {
    let mut conn = db::establish_connection();
    let result = crate::schema::assinaturas::dsl::assinaturas
        .filter(crate::schema::assinaturas::dsl::id_usuario.eq(&usuario_id_payload))
        .first::<Assinatura>(&mut conn)
        .optional()
        .expect("Erro ao buscar assinatura por usuário");
    Json(result)
}


pub async fn create_assinatura_handler(
    Json(payload): Json<NewAssinatura>,
) -> Json<Assinatura> {
    create_assinatura(axum::Json(payload)).await
}

/// Renova a assinatura do usuário adicionando `meses` * 30 dias ao `periodo_fim` da assinatura mais recente.
/// `meses` deve ser >= 1. Retorna Ok(()) em sucesso ou Err(String) com mensagem de erro.
pub async fn renovar_assinatura_por_usuario(id_usuario_param: String, meses: i64) -> Result<(), String> {
    if meses < 1 {
        return Err("meses deve ser >= 1".to_string());
    }

    // Operação de DB feita de forma síncrona, mas função é async para facilitar chamada interna
    let conn = &mut db::establish_connection();
    let hoje = Utc::now().naive_utc();
    let delta = Duration::days(30 * meses);

    match assinaturas
        .filter(assinatura_id_usuario.eq(&id_usuario_param))
        .order(periodo_fim.desc())
        .first::<Assinatura>(conn)
    {
        Ok(mut a) => {
            if a.periodo_fim < hoje {
                a.periodo_inicio = hoje;
                a.periodo_fim = hoje + delta;
            } else {
                a.periodo_fim += delta;
            }
            a.atualizado_em = hoje;

            diesel::update(assinaturas.filter(assinatura_id.eq(&a.id)))
                .set((periodo_inicio.eq(a.periodo_inicio), periodo_fim.eq(a.periodo_fim), assinatura_atualizado_em.eq(a.atualizado_em)))
                .execute(conn)
                 .map_err(|e| format!("Erro ao atualizar assinatura: {e:?}"))?;

            Ok(())
        }
               Err(diesel::result::Error::NotFound) => Err(format!("Assinatura não encontrada para usuário: {id_usuario_param}")),
    Err(e) => Err(format!("Erro ao buscar assinatura: {e:?}")),
    }
}



