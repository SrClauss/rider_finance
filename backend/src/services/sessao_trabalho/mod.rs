use crate::utils::date_utils::parse_datetime;
use axum::{Json, extract::{Path, Query}};
use crate::db;
use crate::models::SessaoTrabalho;
use crate::schema::sessoes_trabalho::dsl::*;
use diesel::prelude::*;

#[derive(serde::Deserialize, serde::Serialize, Clone)]
pub struct NovaSessaoPayload {
    pub id_usuario: String,
    pub inicio: String, // Alterado para String para aceitar do frontend
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
    let now = chrono::Local::now().naive_local();

    // Parse da data de início
    let inicio_dt = match chrono::NaiveDateTime::parse_from_str(&payload.inicio, "%Y-%m-%dT%H:%M") {
        Ok(dt) => dt,
        Err(_e) => {
            // Fallback para now se parsing falhar
            now
        }
    };

    let nova = crate::models::sessao_trabalho::NewSessaoTrabalho {
        id: ulid::Ulid::new().to_string(),
        id_usuario: payload.id_usuario,
        inicio: inicio_dt,
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
    let now = chrono::Local::now().naive_local();

    // Parse da data de início
    let inicio_dt = match parse_datetime(&payload.inicio) {
        Ok(dt) => dt,
        Err(_e) => {
            // Fallback para now se parsing falhar
            now
        }
    };

    let nova = crate::models::sessao_trabalho::NewSessaoTrabalho {
        id: ulid::Ulid::new().to_string(),
        id_usuario: payload.id_usuario,
        inicio: inicio_dt,
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
    pub inicio: String, // Data/hora de início da sessão
    pub fim: String,    // Data/hora de fim da sessão
    pub local_fim: Option<String>,
}

pub async fn encerrar_sessao_handler(Json(payload): Json<EncerrarPayload>) -> Json<Option<SessaoTrabalho>> {
    let conn = &mut db::establish_connection();
    use crate::schema::transacoes::dsl as t_dsl;

    // Converte strings para NaiveDateTime
    let inicio_dt = match parse_datetime(&payload.inicio) {
        Ok(dt) => dt,
        Err(_e) => {
            return Json(None);
        }
    };

    let fim_dt = match parse_datetime(&payload.fim) {
        Ok(dt) => dt,
        Err(_e) => {
            return Json(None);
        }
    };

    // Busca sessao
    match sessoes_trabalho.filter(id.eq(&payload.id_sessao)).first::<crate::models::SessaoTrabalho>(conn) {
        Ok(s) => {
            // Busca todas as transações do usuário no período
            let todas_transacoes: Vec<crate::models::transacao::Transacao> = t_dsl::transacoes
                .filter(t_dsl::id_usuario.eq(&s.id_usuario)
                    .and(t_dsl::data.ge(inicio_dt))
                    .and(t_dsl::data.le(fim_dt)))
                .load(conn)
                .unwrap_or_default();

            // Calcula totais baseado nas transações encontradas
            let entradas: Vec<&crate::models::transacao::Transacao> = todas_transacoes.iter()
                .filter(|t| t.tipo == "entrada")
                .collect();

            let saidas: Vec<&crate::models::transacao::Transacao> = todas_transacoes.iter()
                .filter(|t| t.tipo == "saida")
                .collect();

            let total_ganhos_calc: i32 = entradas.iter().map(|t| t.valor).sum();
            let total_gastos_calc: i32 = saidas.iter().map(|t| t.valor).sum();
            let total_corridas_calc: i32 = entradas.len() as i32; // Corridas = número de entradas

            // Calcula minutos baseado na diferença entre inicio e fim
            let duracao = fim_dt.signed_duration_since(inicio_dt);
            let total_minutos_calc = duracao.num_minutes().abs() as i32;

            // Atualiza sessão com os totais calculados
            let _updated = diesel::update(sessoes_trabalho.filter(id.eq(&payload.id_sessao)))
                .set((
                    fim.eq(Some(fim_dt)),
                    local_fim.eq(payload.local_fim),
                    total_minutos.eq(total_minutos_calc),
                    total_ganhos.eq(total_ganhos_calc),
                    total_corridas.eq(total_corridas_calc),
                    total_gastos.eq(total_gastos_calc),
                    eh_ativa.eq(false),
                    atualizado_em.eq(chrono::Local::now().naive_local())
                ))
                .execute(conn)
                .ok();

            // Retorna sessão atualizada
            let sessao = sessoes_trabalho.filter(id.eq(&payload.id_sessao)).first::<crate::models::SessaoTrabalho>(conn).ok();
            Json(sessao)
        },
        Err(_) => {
            Json(None)
        }
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
