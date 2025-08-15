    use crate::db::establish_connection;
    pub fn create_fake_user() -> String {
        use crate::models::usuario::NewUsuario;
        use crate::schema::usuarios::dsl::*;
        let conn = &mut establish_connection();
        let now = chrono::Utc::now().naive_utc();
        let usuario_id = "user_sessao_test".to_string();
        let new_user = NewUsuario {
            id: usuario_id.clone(),
            nome_usuario: "user_sessao_test".to_string(),
            email: "sessao@teste.com".to_string(),
            senha: "senha123".to_string(),
            nome_completo: "Sessao Teste".to_string(),
            telefone: "11999999999".to_string(),
            veiculo: "Carro".to_string(),
            criado_em: now,
            atualizado_em: now,
            ultima_tentativa_redefinicao: now,
            address: "Rua Teste".to_string(),
            address_number: "123".to_string(),
            complement: "Apto 1".to_string(),
            postal_code: "01234567".to_string(),
            province: "Centro".to_string(),
            city: "São Paulo".to_string(),
            cpfcnpj: "12345678900".to_string(),
        };
        diesel::insert_into(usuarios)
            .values(&new_user)
            .execute(conn)
            .expect("Erro ao inserir usuário");
        usuario_id
    }
    pub use crate::test_utils::user::{create_fake_user_with, create_fake_user_default};
#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::establish_connection;
    use diesel::prelude::*;
    use chrono::{NaiveDate};
    use crate::schema::sessoes_trabalho;
    use serial_test::serial;

    fn clean_db() {
        let conn = &mut establish_connection();
        diesel::delete(sessoes_trabalho::dsl::sessoes_trabalho).execute(conn).ok();
    }

    fn fake_payload() -> NovaSessaoPayload {
        NovaSessaoPayload {
            id_usuario: "user_sessao_test".to_string(),
            inicio: NaiveDate::from_ymd_opt(2025,8,14).unwrap().and_hms_opt(8,0,0).unwrap(),
            fim: Some(NaiveDate::from_ymd_opt(2025,8,14).unwrap().and_hms_opt(12,0,0).unwrap()),
            total_minutos: Some(240),
            local_inicio: Some("A".to_string()),
            local_fim: Some("B".to_string()),
            total_corridas: 5,
            total_ganhos: 200,
            total_gastos: 50,
            plataforma: Some("Uber".to_string()),
            observacoes: Some("Teste".to_string()),
            clima: Some("Sol".to_string()),
            eh_ativa: false,
        }
    }

    #[tokio::test]
    #[serial]
    async fn test_criar_listar_deletar_sessao() {
    clean_db();
    create_fake_user();
    // Cria sessão
    let payload = fake_payload();
    let resp = criar_sessao_handler(axum::Json(payload.clone())).await;
    assert_eq!(resp.id_usuario, "user_sessao_test");
    // Lista sessões
    let list = listar_sessoes_handler(axum::extract::Path("user_sessao_test".to_string())).await;
    assert_eq!(list.0.len(), 1);
    // Deleta sessão
    let del = deletar_sessao_handler(axum::extract::Path(resp.id.clone())).await;
    assert!(del.0);
    // Lista novamente
    let list2 = listar_sessoes_handler(axum::extract::Path("user_sessao_test".to_string())).await;
    assert_eq!(list2.0.len(), 0);
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
    let now = chrono::Utc::now().naive_utc();
    let nova = crate::models::sessao_trabalho::NewSessaoTrabalho {
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
        criado_em: now,
        atualizado_em: now,
    };
    diesel::insert_into(sessoes_trabalho)
        .values(&nova)
        .execute(conn)
        .unwrap();
    // Retorna SessaoTrabalho após inserir
    let sessao = sessoes_trabalho
        .order(criado_em.desc())
        .first::<crate::models::SessaoTrabalho>(conn)
        .unwrap();
    Json(sessao)
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
