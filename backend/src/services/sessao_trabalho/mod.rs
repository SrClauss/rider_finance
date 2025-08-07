#[cfg(test)]
mod tests {
    use super::*;
    use axum::Json;
    use ulid::Ulid;
    use chrono::Utc;
    use crate::db;
    use crate::models::SessaoTrabalho;

    #[tokio::test]
    async fn test_criar_listar_deletar_sessao() {
        let conn = &mut db::establish_connection_test();
        diesel::delete(crate::schema::sessoes_trabalho::dsl::sessoes_trabalho).execute(conn).ok();

        let id_usuario = Ulid::new().to_string();
        let payload = NovaSessaoPayload {
            id_usuario: id_usuario.clone(),
            inicio: Utc::now().naive_utc(),
            fim: None,
            total_minutos: Some(60),
            local_inicio: Some("A".to_string()),
            local_fim: Some("B".to_string()),
            total_corridas: 2,
            total_ganhos: 100,
            total_gastos: 20,
            plataforma: Some("Uber".to_string()),
            observacoes: Some("Teste".to_string()),
            clima: Some("Sol".to_string()),
            eh_ativa: true,
        };
        let res = criar_sessao_handler(Json(payload.clone())).await;
        assert_eq!(res.id_usuario, id_usuario);
        assert_eq!(res.total_ganhos, 100);

        let lista = listar_sessoes_handler(axum::extract::Path(id_usuario.clone())).await;
        assert_eq!(lista.len(), 1);
        assert_eq!(lista[0].id_usuario, id_usuario);

        let del = deletar_sessao_handler(axum::extract::Path(lista[0].id.clone())).await;
        assert!(del);

        let lista2 = listar_sessoes_handler(axum::extract::Path(id_usuario)).await;
        assert_eq!(lista2.len(), 0);
    }
}
use axum::{Json, extract::Path};
use crate::db;
use crate::models::SessaoTrabalho;
use crate::schema::sessoes_trabalho::dsl::*;
use diesel::prelude::*;

#[derive(serde::Deserialize, serde::Serialize, Clone)]
pub struct NovaSessaoPayload {
    pub id_usuario: String,
    pub inicio: chrono::NaiveDateTime,
    pub fim: Option<chrono::NaiveDateTime>,
    pub total_minutos: Option<i32>,
    pub local_inicio: Option<String>,
    pub local_fim: Option<String>,
    pub total_corridas: i32,
    pub total_ganhos: i32,
    pub total_gastos: i32,
    pub plataforma: Option<String>,
    pub observacoes: Option<String>,
    pub clima: Option<String>,
    pub eh_ativa: bool,
}

pub async fn criar_sessao_handler(Json(payload): Json<NovaSessaoPayload>) -> Json<SessaoTrabalho> {
    let conn = &mut db::establish_connection();
    let nova = SessaoTrabalho {
        id: ulid::Ulid::new().to_string(),
        id_usuario: payload.id_usuario,
        inicio: payload.inicio,
        fim: payload.fim,
        total_minutos: payload.total_minutos,
        local_inicio: payload.local_inicio,
        local_fim: payload.local_fim,
        total_corridas: payload.total_corridas,
        total_ganhos: payload.total_ganhos,
        total_gastos: payload.total_gastos,
        plataforma: payload.plataforma,
        observacoes: payload.observacoes,
        clima: payload.clima,
        eh_ativa: payload.eh_ativa,
        criado_em: chrono::Utc::now().naive_utc(),
        atualizado_em: chrono::Utc::now().naive_utc(),
    };
    diesel::insert_into(sessoes_trabalho)
        .values(&nova)
        .execute(conn)
        .unwrap();
    Json(nova)
}

pub async fn listar_sessoes_handler(Path(id_usuario_param): Path<String>) -> Json<Vec<SessaoTrabalho>> {
    let conn = &mut db::establish_connection();
    let lista = sessoes_trabalho
        .filter(id_usuario.eq(id_usuario_param))
        .order(inicio.desc())
        .load::<SessaoTrabalho>(conn)
        .unwrap();
    Json(lista)
}

pub async fn deletar_sessao_handler(Path(id_param): Path<String>) -> Json<bool> {
    let conn = &mut db::establish_connection();
    let count = diesel::delete(sessoes_trabalho.filter(id.eq(id_param))).execute(conn).unwrap_or(0);
    Json(count > 0)
}
