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
        std::env::set_var("ENVIRONMENT", "tests");
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
    let list = listar_sessoes_handler(
        axum::extract::Path("user_sessao_test".to_string()),
        axum::extract::Query(super::Paginacao { page: Some(1), page_size: Some(10) })
    ).await;
    assert_eq!(list.0.items.len(), 1);
    // Deleta sessão
    let del = deletar_sessao_handler(axum::extract::Path(resp.id.clone())).await;
    assert!(del.0);
    // Lista novamente
    let list2 = listar_sessoes_handler(
        axum::extract::Path("user_sessao_test".to_string()),
        axum::extract::Query(super::Paginacao { page: Some(1), page_size: Some(10) })
    ).await;
    assert_eq!(list2.0.items.len(), 0);
    }
}

use axum::{Json, extract::{Path, Query}};
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


#[derive(serde::Deserialize)]
pub struct Paginacao {
    pub page: Option<usize>,
    pub page_size: Option<usize>,
}

#[derive(serde::Serialize)]
pub struct PaginatedSessoes {
    pub total: usize,
    pub page: usize,
    pub page_size: usize,
    pub items: Vec<SessaoTrabalho>,
}

pub async fn listar_sessoes_handler(
    Path(id_usuario_param): Path<String>,
    Query(paginacao): Query<Paginacao>,
) -> Json<PaginatedSessoes> {
    let conn = &mut db::establish_connection();
    let page = paginacao.page.unwrap_or(1).max(1);
    let page_size = paginacao.page_size.unwrap_or(10).clamp(1, 100);
    let offset = (page - 1) * page_size;

    let total: i64 = sessoes_trabalho
        .filter(id_usuario.eq(&id_usuario_param))
        .count()
        .get_result(conn)
        .unwrap_or(0);

    let items = sessoes_trabalho
        .filter(id_usuario.eq(&id_usuario_param))
        .order(inicio.desc())
        .limit(page_size as i64)
        .offset(offset as i64)
        .load::<SessaoTrabalho>(conn)
        .unwrap_or_default();

    Json(PaginatedSessoes {
        total: total as usize,
        page,
        page_size,
        items,
    })
}

pub async fn deletar_sessao_handler(Path(id_param): Path<String>) -> Json<bool> {
    let conn = &mut db::establish_connection();
    let count = diesel::delete(sessoes_trabalho.filter(id.eq(id_param))).execute(conn).unwrap_or(0);
    Json(count > 0)
}

// Novo: iniciar sessão (cria sessão ativa com fim = None)
pub async fn iniciar_sessao_handler(Json(payload): Json<NovaSessaoPayload>) -> Json<SessaoTrabalho> {
    let conn = &mut db::establish_connection();
    let now = chrono::Utc::now().naive_utc();
    let nova = crate::models::sessao_trabalho::NewSessaoTrabalho {
        id: ulid::Ulid::new().to_string(),
        id_usuario: payload.id_usuario,
        inicio: payload.inicio,
        fim: None,
        total_minutos: None,
        local_inicio: payload.local_inicio,
        local_fim: None,
        total_corridas: 0,
        total_ganhos: 0,
        total_gastos: 0,
        plataforma: payload.plataforma,
        observacoes: payload.observacoes,
        clima: payload.clima,
        eh_ativa: true,
        criado_em: now,
        atualizado_em: now,
    };
    diesel::insert_into(sessoes_trabalho)
        .values(&nova)
        .execute(conn)
        .unwrap();
    let sessao = sessoes_trabalho
        .order(criado_em.desc())
        .first::<crate::models::SessaoTrabalho>(conn)
        .unwrap();
    Json(sessao)
}

// Novo: encerrar sessão (calcula totals a partir das transacoes do usuario entre inicio..fim)
#[derive(serde::Deserialize)]
pub struct EncerrarPayload {
    pub id_sessao: String,
    pub fim: chrono::NaiveDateTime,
    pub local_fim: Option<String>,
    pub observacoes: Option<String>,
}

pub async fn encerrar_sessao_handler(Json(payload): Json<EncerrarPayload>) -> Json<Option<SessaoTrabalho>> {
    let conn = &mut db::establish_connection();
    // Busca sessao
    match sessoes_trabalho.filter(id.eq(&payload.id_sessao)).first::<crate::models::SessaoTrabalho>(conn) {
        Ok(s) => {
            // calcula totals: transacoes tipo 'entrada' entre s.inicio .. payload.fim
            use crate::schema::transacoes::dsl as t_dsl;
            let entradas: Vec<crate::models::transacao::Transacao> = t_dsl::transacoes
                .filter(t_dsl::id_usuario.eq(&s.id_usuario).and(t_dsl::tipo.eq("receita")).and(t_dsl::data.ge(s.inicio)).and(t_dsl::data.le(payload.fim)))
                .load(conn)
                .unwrap_or_default();
            let total_ganhos_sum: i32 = entradas.iter().map(|tr| tr.valor).sum();
            let total_corridas_count: i32 = entradas.len() as i32;
            let total_gastos_sum = 0; // manter 0 por enquanto
            // Atualiza sessao
            let _updated = diesel::update(sessoes_trabalho.filter(id.eq(&payload.id_sessao)))
                .set((fim.eq(Some(payload.fim)), total_ganhos.eq(total_ganhos_sum), total_corridas.eq(total_corridas_count), total_gastos.eq(total_gastos_sum), local_fim.eq(payload.local_fim.clone()), observacoes.eq(payload.observacoes.clone()), eh_ativa.eq(false), atualizado_em.eq(chrono::Utc::now().naive_utc())))
                .execute(conn)
                .ok();
            // Retorna sessao atualizada
            let sessao = sessoes_trabalho.filter(id.eq(&payload.id_sessao)).first::<crate::models::SessaoTrabalho>(conn).ok();
            Json(sessao)
        },
        Err(_) => Json(None),
    }
}

// Novo: obter sessao com transacoes (inclui categoria.nome e icone)
#[derive(serde::Serialize)]
pub struct SessaoComTransacoes {
    pub sessao: crate::models::SessaoTrabalho,
    pub transacoes: Vec<serde_json::Value>,
}

pub async fn get_sessao_com_transacoes_handler(Path(id_param): Path<String>) -> Json<Option<SessaoComTransacoes>> {
    let conn = &mut db::establish_connection();
    if let Ok(s) = sessoes_trabalho.filter(id.eq(id_param.clone())).first::<crate::models::SessaoTrabalho>(conn) {
        use crate::schema::transacoes::dsl as t_dsl;
        use crate::schema::categorias::dsl as c_dsl;
        let fim_dt = s.fim.unwrap_or(chrono::Utc::now().naive_utc());
        let trans: Vec<crate::models::transacao::Transacao> = t_dsl::transacoes
            .filter(t_dsl::id_usuario.eq(&s.id_usuario).and(t_dsl::data.ge(s.inicio)).and(t_dsl::data.le(fim_dt)))
            .load(conn)
            .unwrap_or_default();
        // Para cada transacao, buscar categoria e montar objeto simples
        let mut items: Vec<serde_json::Value> = Vec::new();
        for tr in trans.into_iter() {
            let cat = c_dsl::categorias.filter(c_dsl::id.eq(&tr.id_categoria)).first::<crate::models::categoria::Categoria>(conn).ok();
            let obj = serde_json::json!({
                "id": tr.id,
                "valor": tr.valor,
                "tipo": tr.tipo,
                "descricao": tr.descricao,
                "data": tr.data,
                "categoria": cat.map(|c| serde_json::json!({"id": c.id, "nome": c.nome, "icone": c.icone}))
            });
            items.push(obj);
        }
        Json(Some(SessaoComTransacoes { sessao: s, transacoes: items }))
    } else {
        Json(None)
    }
}
