use chrono::{DateTime, Datelike, Duration, Local, TimeZone, Utc};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::models::configuracao::Configuracao;
use crate::schema::configuracoes::dsl as config_dsl;
use crate::schema::transacoes::dsl as transacao_dsl;
use crate::schema::sessoes_trabalho::dsl as sessao_dsl;
use crate::schema::metas::dsl as meta_dsl;


// Tipos públicos para uso pela camada API
#[derive(Serialize, Clone, Default)]
pub struct DashboardStats {
    pub ganhos_hoje: Option<i32>,
    pub ganhos_ontem: Option<i32>,
    pub ganhos_semana: Option<i32>,
    pub ganhos_semana_passada: Option<i32>,
    pub ganhos_mes: Option<i32>,
    pub ganhos_mes_passado: Option<i32>,

    pub gastos_hoje: Option<i32>,
    pub gastos_ontem: Option<i32>,
    pub gastos_semana: Option<i32>,
    pub gastos_semana_passada: Option<i32>,
    pub gastos_mes: Option<i32>,
    pub gastos_mes_passado: Option<i32>,

    pub lucro_hoje: Option<i32>,
    pub lucro_ontem: Option<i32>,
    pub lucro_semana: Option<i32>,
    pub lucro_semana_passada: Option<i32>,
    pub lucro_mes: Option<i32>,
    pub lucro_mes_passado: Option<i32>,

    pub corridas_hoje: Option<u32>,
    pub corridas_ontem: Option<u32>,
    pub corridas_semana: Option<u32>,
    pub corridas_semana_passada: Option<u32>,
    pub corridas_mes: Option<u32>,
    pub corridas_mes_passado: Option<u32>,

    pub horas_hoje: Option<i32>,
    pub horas_ontem: Option<i32>,
    pub horas_semana: Option<i32>,
    pub horas_semana_passada: Option<i32>,
    pub horas_mes: Option<i32>,
    pub horas_mes_passado: Option<i32>,

    pub eficiencia: Option<i32>,
    pub meta_diaria: Option<i32>,
    pub meta_semanal: Option<i32>,
    pub tendencia_ganhos: Option<i32>,
    pub tendencia_gastos: Option<i32>,
    pub tendencia_corridas: Option<i32>,
    pub ganhos_7dias: Vec<i32>,
    pub gastos_7dias: Vec<i32>,
    pub lucro_7dias: Vec<i32>,
    pub corridas_7dias: Vec<u32>,
    pub horas_7dias: Vec<i32>,
    pub ultimos_30_dias_labels: Vec<String>,
    pub ganhos_30dias: Vec<i32>,
    pub gastos_30dias: Vec<i32>,
    pub lucro_30dias: Vec<i32>,
    pub corridas_30dias: Vec<u32>,
    pub horas_30dias: Vec<i32>,
    pub projecao_mes: Option<i32>,
    pub projecao_semana: Option<i32>,
    pub trend_method: String,
    pub platforms: std::collections::HashMap<String, PlatformResult>,
    pub top_sources: TopSources,
}

#[derive(Serialize, Clone, Default)]
pub struct TopSourceItem {
    pub periodo: String,
    pub tipo: String,
    pub categoria_id: Option<String>,
    pub nome: Option<String>,
    pub icone: Option<String>,
    pub cor: Option<String>,
    pub valor: i64,
}

#[derive(Serialize, Clone, Default)]
pub struct TopSources {
    pub receitas: Vec<TopSourceItem>,
    pub despesas: Vec<TopSourceItem>,
}

#[derive(Deserialize, Clone)]
pub struct DashboardFiltro {
    pub periodo: Option<String>,
    pub data_inicio: Option<DateTime<Utc>>,
    pub data_fim: Option<DateTime<Utc>>,
    pub tipo: Option<String>,
    pub categoria: Option<String>,
}

#[derive(Deserialize)]
pub struct PlatformQuery {
    pub names: Option<String>,
}

#[derive(Serialize, Clone, Default)]
pub struct PlatformResult {
    pub ganhos: i32,
    pub corridas: u32,
    pub icone: Option<String>,
    pub cor: Option<String>,
    pub periodo: String,
}

// ---------------- Utilitárias e cálculos (migradas da antiga função)
//
// regressao_linear, media_movel, media_excluindo_extremos, helpers de soma,
// top_source_for_period, compute_dashboard_stats, compute_platforms
//

pub fn regressao_linear(xs: &[f64], ys: &[f64]) -> Option<(f64, f64)> {
    if xs.len() != ys.len() || xs.is_empty() {
        return None;
    }
    let n = xs.len() as f64;
    let soma_x = xs.iter().sum::<f64>();
    let soma_y = ys.iter().sum::<f64>();
    let soma_xx = xs.iter().map(|x| x * x).sum::<f64>();
    let soma_xy = xs.iter().zip(ys.iter()).map(|(x, y)| x * y).sum::<f64>();

    let denominador = n * soma_xx - soma_x * soma_x;
    if denominador == 0.0 {
        return None;
    }
    let a = (n * soma_xy - soma_x * soma_y) / denominador;
    let b = (soma_y * soma_xx - soma_x * soma_xy) / denominador;
    Some((a, b))
}

fn media_movel(data: &[i32], window: usize) -> Option<i32> {
    if data.len() < window || window == 0 {
        return None;
    }
    let start = data.len() - window;
    let slice = &data[start..];
    let sum: i64 = slice.iter().map(|&v| v as i64).sum();
    Some((sum as f64 / window as f64).round() as i32)
}

fn media_excluindo_extremos(data: &[i32], percent: usize) -> i32 {
    if data.is_empty() {
        return 0;
    }
    let mut v = data.to_owned();
    v.sort();
    let len = v.len();
    let to_exclude = ((len as f64) * (percent as f64) / 100.0).floor() as usize;
    let start = to_exclude.min(len.saturating_sub(1));
    let end = len.saturating_sub(to_exclude);
    let slice = if start >= end { &v[..] } else { &v[start..end] };
    let sum: i64 = slice.iter().map(|&x| x as i64).sum();
    (sum as f64 / (slice.len() as f64)).round() as i32
}

fn soma_periodo(tipo: &str, id_usuario: &str, inicio: DateTime<Utc>, fim: DateTime<Utc>, conn: &mut diesel::PgConnection) -> Option<i32> {
    use crate::schema::transacoes::dsl as transacao_dsl_local;
    transacao_dsl_local::transacoes
        .filter(transacao_dsl_local::id_usuario.eq(id_usuario))
        .filter(transacao_dsl_local::data.ge(inicio))
        .filter(transacao_dsl_local::data.le(fim))
        .filter(transacao_dsl_local::tipo.eq(tipo))
        .select(diesel::dsl::sum(transacao_dsl_local::valor))
        .first::<Option<i64>>(conn).ok().flatten().map(|v| v as i32)
}

fn soma_corridas(id_usuario: &str, inicio: DateTime<Utc>, fim: DateTime<Utc>, conn: &mut diesel::PgConnection) -> Option<u32> {
    use crate::schema::transacoes::dsl as transacao_dsl_local;
    transacao_dsl_local::transacoes
        .filter(transacao_dsl_local::id_usuario.eq(id_usuario))
        .filter(transacao_dsl_local::data.ge(inicio))
        .filter(transacao_dsl_local::data.le(fim))
        .filter(transacao_dsl_local::tipo.eq("entrada"))
        .select(diesel::dsl::sum(transacao_dsl_local::eventos))
        .first::<Option<i64>>(conn).ok().flatten().map(|v| v as u32)
}

fn soma_horas(id_usuario: &str, inicio: DateTime<Utc>, fim: DateTime<Utc>, conn: &mut diesel::PgConnection) -> Option<i32> {
    use crate::schema::sessoes_trabalho::dsl as sessao_dsl_local;
    let minutos = sessao_dsl_local::sessoes_trabalho
        .filter(sessao_dsl_local::id_usuario.eq(id_usuario))
        .filter(sessao_dsl_local::inicio.ge(inicio))
        .filter(sessao_dsl_local::inicio.le(fim))
        .select(diesel::dsl::sum(sessao_dsl_local::total_minutos))
        .first::<Option<i64>>(conn).ok().flatten().map(|v| v as i32);
    minutos.map(|m| m / 60)
}

fn top_source_for_period(tipo: &str, inicio: DateTime<Utc>, fim: DateTime<Utc>, id_usuario: &str, conn: &mut diesel::PgConnection) -> TopSourceItem {
    use crate::schema::transacoes::dsl as trans_dsl;
    use crate::schema::categorias::dsl as cat_dsl;

    let base_query = trans_dsl::transacoes
        .filter(trans_dsl::id_usuario.eq(id_usuario))
        .filter(trans_dsl::data.ge(inicio))
        .filter(trans_dsl::data.le(fim))
        .filter(trans_dsl::tipo.eq(tipo));

    let vec_res: Vec<(String, Option<i64>)> = base_query
        .group_by(trans_dsl::id_categoria)
        .select((trans_dsl::id_categoria, diesel::dsl::sum(trans_dsl::valor)))
        .order(diesel::dsl::sum(trans_dsl::valor).desc())
        .load::<(String, Option<i64>)>(conn)
        .unwrap_or_default();

    let res = vec_res.into_iter().next();

    if let Some((cat_id, cnt_opt)) = res {
        let cnt = cnt_opt.unwrap_or(0);
        let categoria: Option<crate::models::Categoria> = cat_dsl::categorias
            .filter(cat_dsl::id.eq(&cat_id))
            .first::<crate::models::Categoria>(conn)
            .optional()
            .unwrap_or(None);
        TopSourceItem {
            periodo: "".to_string(),
            tipo: tipo.to_string(),
            categoria_id: Some(cat_id.clone()),
            nome: categoria.as_ref().map(|c| c.nome.clone()),
            icone: categoria.as_ref().and_then(|c| c.icone.clone()),
            cor: categoria.as_ref().and_then(|c| c.cor.clone()),
            valor: cnt,
        }
    } else {
        TopSourceItem {
            periodo: "".to_string(),
            tipo: tipo.to_string(),
            categoria_id: None,
            nome: None,
            icone: None,
            cor: None,
            valor: 0,
        }
    }
}

// Função pública que encapsula todo o cálculo do dashboard (antes estava no handler)
// ALTERAÇÃO: removeu `params: DashboardFiltro`
pub fn compute_dashboard_stats(conn: &mut diesel::PgConnection, id_usuario: &str) -> DashboardStats {
    // equivalente ao início do handler original
    let now = Local::now().naive_local();

    // Buscar configurações do usuário
    let configs: Vec<Configuracao> = config_dsl::configuracoes
        .filter(config_dsl::id_usuario.eq(id_usuario))
        .load(conn)
        .unwrap_or_default();
    let get_config = |chave: &str| -> Option<String> {
        configs.iter().find(|c| c.chave == chave).and_then(|c| c.valor.clone())
    };
    let projecao_metodo = get_config("projecao_metodo").unwrap_or_else(|| "media_movel_3".to_string());
    let projecao_percentual_extremos: usize = get_config("projecao_percentual_extremos").and_then(|v| v.parse().ok()).unwrap_or(10);

    // OBS: não recebemos mais filtros via params => comportamento padrão:
    // INICIO DO DIA '00:00' ATÉ AGORA
    let inicio = Utc.from_utc_datetime(&now.date().and_hms_opt(0, 0, 0).unwrap());
    let fim = Utc.from_utc_datetime(&now);
    // Arrays dos últimos 7 dias
    let mut ganhos_7dias = Vec::with_capacity(7);
    let mut gastos_7dias = Vec::with_capacity(7);
    let mut lucro_7dias = Vec::with_capacity(7);
    let mut corridas_7dias = Vec::with_capacity(7);
    let mut horas_7dias = Vec::with_capacity(7);
    for i in (0..7).rev() {
        let dia = now.date() - Duration::days(i);
        let inicio_dia = Utc.from_utc_datetime(&dia.and_hms_opt(0, 0, 0).unwrap());
        let fim_dia = Utc.from_utc_datetime(&dia.and_hms_opt(23, 59, 59).unwrap());
        let ganhos_dia: i32 = transacao_dsl::transacoes
            .filter(transacao_dsl::id_usuario.eq(id_usuario))
            .filter(transacao_dsl::data.ge(inicio_dia))
            .filter(transacao_dsl::data.le(fim_dia))
            .filter(transacao_dsl::tipo.eq("entrada"))
            .select(diesel::dsl::sum(transacao_dsl::valor))
            .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
        let gastos_dia: i32 = transacao_dsl::transacoes
            .filter(transacao_dsl::id_usuario.eq(id_usuario))
            .filter(transacao_dsl::data.ge(inicio_dia))
            .filter(transacao_dsl::data.le(fim_dia))
            .filter(transacao_dsl::tipo.eq("saida"))
            .select(diesel::dsl::sum(transacao_dsl::valor))
            .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
        let corridas_dia: u32 = sessao_dsl::sessoes_trabalho
            .filter(sessao_dsl::id_usuario.eq(id_usuario))
            .filter(sessao_dsl::inicio.ge(inicio_dia))
            .filter(sessao_dsl::inicio.le(fim_dia))
            .select(diesel::dsl::sum(sessao_dsl::total_corridas))
            .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0).try_into().unwrap_or(0);
        let horas_dia: i32 = sessao_dsl::sessoes_trabalho
            .filter(sessao_dsl::id_usuario.eq(id_usuario))
            .filter(sessao_dsl::inicio.ge(inicio_dia))
            .filter(sessao_dsl::inicio.le(fim_dia))
            .select(diesel::dsl::sum(sessao_dsl::total_minutos))
            .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32 / 60;
        ganhos_7dias.push(ganhos_dia);
        gastos_7dias.push(gastos_dia);
        lucro_7dias.push(ganhos_dia - gastos_dia);
        corridas_7dias.push(corridas_dia);
        horas_7dias.push(horas_dia);
    }

    // Arrays dos últimos 30 dias corridos
    let mut ultimos_30_dias_labels = Vec::new();
    let mut ganhos_30dias = Vec::new();
    let mut gastos_30dias = Vec::new();
    let mut lucro_30dias = Vec::new();
    let mut corridas_30dias = Vec::new();
    let mut horas_30dias = Vec::new();
    for i in (0..30).rev() {
        let data_dia = now.date() - Duration::days(i);
        ultimos_30_dias_labels.push(data_dia.format("%d/%m").to_string());
        let inicio_dia = Utc.from_utc_datetime(&data_dia.and_hms_opt(0, 0, 0).unwrap());
        let fim_dia = Utc.from_utc_datetime(&data_dia.and_hms_opt(23, 59, 59).unwrap());
        let ganhos_dia: i32 = transacao_dsl::transacoes
            .filter(transacao_dsl::id_usuario.eq(id_usuario))
            .filter(transacao_dsl::data.ge(inicio_dia))
            .filter(transacao_dsl::data.le(fim_dia))
            .filter(transacao_dsl::tipo.eq("entrada"))
            .select(diesel::dsl::sum(transacao_dsl::valor))
            .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
        let gastos_dia: i32 = transacao_dsl::transacoes
            .filter(transacao_dsl::id_usuario.eq(id_usuario))
            .filter(transacao_dsl::data.ge(inicio_dia))
            .filter(transacao_dsl::data.le(fim_dia))
            .filter(transacao_dsl::tipo.eq("saida"))
            .select(diesel::dsl::sum(transacao_dsl::valor))
            .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
        let corridas_dia: u32 = sessao_dsl::sessoes_trabalho
            .filter(sessao_dsl::id_usuario.eq(id_usuario))
            .filter(sessao_dsl::inicio.ge(inicio_dia))
            .filter(sessao_dsl::inicio.le(fim_dia))
            .select(diesel::dsl::sum(sessao_dsl::total_corridas))
            .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0).try_into().unwrap_or(0);
        let horas_dia: i32 = sessao_dsl::sessoes_trabalho
            .filter(sessao_dsl::id_usuario.eq(id_usuario))
            .filter(sessao_dsl::inicio.ge(inicio_dia))
            .filter(sessao_dsl::inicio.le(fim_dia))
            .select(diesel::dsl::sum(sessao_dsl::total_minutos))
            .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32 / 60;
        ganhos_30dias.push(ganhos_dia);
        gastos_30dias.push(gastos_dia);
        lucro_30dias.push(ganhos_dia - gastos_dia);
        corridas_30dias.push(corridas_dia);
        horas_30dias.push(horas_dia);
    }

    // Projeção do mês corrente
    let hoje = now.date();
    let mes = hoje.month();
    let ano = hoje.year();
    let inicio_mes = chrono::NaiveDate::from_ymd_opt(ano, mes, 1).unwrap();
    let dias_passados_mes = (hoje - inicio_mes).num_days() + 1;
    let dias_no_mes = chrono::NaiveDate::from_ymd_opt(ano, mes % 12 + 1, 1)
        .unwrap_or_else(|| chrono::NaiveDate::from_ymd_opt(ano + 1, 1, 1).unwrap())
        .signed_duration_since(inicio_mes)
        .num_days();
    let mut soma_ganhos_mes = 0;
    for i in 0..dias_passados_mes {
        let data_dia = inicio_mes + chrono::Duration::days(i);
        let inicio_dia = Utc.from_utc_datetime(&data_dia.and_hms_opt(0, 0, 0).unwrap());
        let fim_dia = Utc.from_utc_datetime(&data_dia.and_hms_opt(23, 59, 59).unwrap());
        let ganhos_dia: i32 = transacao_dsl::transacoes
            .filter(transacao_dsl::id_usuario.eq(id_usuario))
            .filter(transacao_dsl::data.ge(inicio_dia))
            .filter(transacao_dsl::data.le(fim_dia))
            .filter(transacao_dsl::tipo.eq("entrada"))
            .select(diesel::dsl::sum(transacao_dsl::valor))
            .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
        soma_ganhos_mes += ganhos_dia;
    }
    let projecao_mes = if dias_passados_mes > 0 {
        Some((soma_ganhos_mes as f64 / dias_passados_mes as f64 * dias_no_mes as f64).round() as i32)
    } else {
        None
    };

    // Projeção da semana corrente
    let inicio_semana = hoje - chrono::Duration::days(hoje.weekday().num_days_from_monday() as i64);
    let dias_passados_semana = (hoje - inicio_semana).num_days() + 1;
    let mut soma_ganhos_semana = 0;
    for i in 0..dias_passados_semana {
        let data_dia = inicio_semana + chrono::Duration::days(i);
        let inicio_dia = Utc.from_utc_datetime(&data_dia.and_hms_opt(0, 0, 0).unwrap());
        let fim_dia = Utc.from_utc_datetime(&data_dia.and_hms_opt(23, 59, 59).unwrap());
        let ganhos_dia: i32 = transacao_dsl::transacoes
            .filter(transacao_dsl::id_usuario.eq(id_usuario))
            .filter(transacao_dsl::data.ge(inicio_dia))
            .filter(transacao_dsl::data.le(fim_dia))
            .filter(transacao_dsl::tipo.eq("entrada"))
            .select(diesel::dsl::sum(transacao_dsl::valor))
            .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
        soma_ganhos_semana += ganhos_dia;
    }
    let projecao_semana = if dias_passados_semana > 0 {
        Some((soma_ganhos_semana as f64 / dias_passados_semana as f64 * 7.0).round() as i32)
    } else {
        None
    };

    // queries customizadas baseadas em periodo calculado acima
    let ganhos_query = transacao_dsl::transacoes
        .filter(transacao_dsl::id_usuario.eq(id_usuario))
        .filter(transacao_dsl::data.ge(inicio))
        .filter(transacao_dsl::data.le(fim))
        .filter(transacao_dsl::tipo.eq("entrada"))
        .into_boxed();
    let gastos_query = transacao_dsl::transacoes
        .filter(transacao_dsl::id_usuario.eq(id_usuario))
        .filter(transacao_dsl::data.ge(inicio))
        .filter(transacao_dsl::data.le(fim))
        .filter(transacao_dsl::tipo.eq("saida"))
        .into_boxed();

    // Buscar todos os valores de ganhos para cálculo customizado
    let ganhos_valores: Vec<i32> = ganhos_query.select(transacao_dsl::valor).load(conn).unwrap_or_default();
    let ganhos: i32 = if projecao_metodo == "mediana" {
        // Cálculo por mediana
        let mut v = ganhos_valores.clone();
        v.sort();
        let len = v.len();
        if len == 0 {
            0
        } else if len % 2 == 1 {
            v[len / 2]
        } else {
            (v[len / 2 - 1] + v[len / 2]) / 2
        }
    } else if projecao_metodo == "media_movel_3" {
        media_movel(&ganhos_7dias, 3).unwrap_or(0)
    } else if projecao_metodo == "media_movel_7" {
        media_movel(&ganhos_7dias, 7).unwrap_or(0)
    } else if projecao_metodo == "media_movel_30" {
        media_movel(&ganhos_30dias, 30).unwrap_or(0)
    } else {
        // Cálculo por média, excluindo extremos se configurado
        media_excluindo_extremos(&ganhos_valores, projecao_percentual_extremos)
    };
    let gastos: i32 = gastos_query.select(diesel::dsl::sum(transacao_dsl::valor)).first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
    let _lucro = ganhos - gastos;
    let _corridas: u32 = sessao_dsl::sessoes_trabalho
        .filter(sessao_dsl::id_usuario.eq(id_usuario))
        .filter(sessao_dsl::inicio.ge(inicio))
        .filter(sessao_dsl::inicio.le(fim))
        .select(diesel::dsl::sum(sessao_dsl::total_corridas))
        .first::<Option<i64>>(conn)
        .unwrap_or(Some(0))
        .unwrap_or(0)
        .try_into()
        .unwrap_or(0);
    let minutos: i32 = sessao_dsl::sessoes_trabalho.filter(sessao_dsl::id_usuario.eq(id_usuario)).filter(sessao_dsl::inicio.ge(inicio)).filter(sessao_dsl::inicio.le(fim)).select(diesel::dsl::sum(sessao_dsl::total_minutos)).first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
    let _horas = minutos / 60;
    let total_metas: i32 = meta_dsl::metas.filter(meta_dsl::id_usuario.eq(id_usuario)).count().get_result::<i64>(conn).unwrap_or(0) as i32;
    let metas_concluidas: i32 = meta_dsl::metas.filter(meta_dsl::id_usuario.eq(id_usuario)).filter(meta_dsl::eh_concluida.eq(true)).count().get_result::<i64>(conn).unwrap_or(0) as i32;
    let eficiencia = if total_metas > 0 { (metas_concluidas * 100) / total_metas } else { 0 };
    let meta_diaria = meta_dsl::metas.filter(meta_dsl::id_usuario.eq(id_usuario)).filter(meta_dsl::eh_ativa.eq(true)).order_by(meta_dsl::data_inicio.desc()).select(meta_dsl::valor_alvo).first::<i32>(conn).ok();
    let meta_semanal = meta_dsl::metas.filter(meta_dsl::id_usuario.eq(id_usuario)).filter(meta_dsl::eh_ativa.eq(true)).order_by(meta_dsl::data_inicio.desc()).select(meta_dsl::valor_alvo).first::<i32>(conn).ok();

    // Arrays do mês atual (por dia)
    let mut ganhos_mes = Vec::new();
    let mut gastos_mes = Vec::new();
    let mut lucro_mes = Vec::new();
    let mes_atual = now.date().month();
    let ano_atual = now.date().year();
    // Descobre o número de dias do mês atual
    let dias_no_mes = chrono::NaiveDate::from_ymd_opt(ano_atual, mes_atual, 1)
        .unwrap()
        .with_month(mes_atual % 12 + 1)
        .unwrap_or_else(|| chrono::NaiveDate::from_ymd_opt(ano_atual + 1, 1, 1).unwrap())
        .signed_duration_since(chrono::NaiveDate::from_ymd_opt(ano_atual, mes_atual, 1).unwrap())
        .num_days();
    for dia in 1..=dias_no_mes.try_into().unwrap_or(0) {
        if let Some(data_dia) = chrono::NaiveDate::from_ymd_opt(ano_atual, mes_atual, dia) {
            let inicio_dia = Utc.from_utc_datetime(&data_dia.and_hms_opt(0, 0, 0).unwrap());
            let fim_dia = Utc.from_utc_datetime(&data_dia.and_hms_opt(23, 59, 59).unwrap());
            let ganhos_dia: i32 = transacao_dsl::transacoes
                .filter(transacao_dsl::id_usuario.eq(id_usuario))
                .filter(transacao_dsl::data.ge(inicio_dia))
                .filter(transacao_dsl::data.le(fim_dia))
                .filter(transacao_dsl::tipo.eq("entrada"))
                .select(diesel::dsl::sum(transacao_dsl::valor))
                .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
            let gastos_dia: i32 = transacao_dsl::transacoes
                .filter(transacao_dsl::id_usuario.eq(id_usuario))
                .filter(transacao_dsl::data.ge(inicio_dia))
                .filter(transacao_dsl::data.le(fim_dia))
                .filter(transacao_dsl::tipo.eq("saida"))
                .select(diesel::dsl::sum(transacao_dsl::valor))
                .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
            ganhos_mes.push(ganhos_dia);
            gastos_mes.push(gastos_dia);
            lucro_mes.push(ganhos_dia - gastos_dia);
        }
    }

    // Tendência usando média móvel conforme configuração
    let trend_regression_from_i32 = |data: &Vec<i32>| -> Option<i32> {
        if data.len() < 2 {
            return None;
        }
        let n = data.len();
        let xs: Vec<f64> = (0..n).map(|i| i as f64).collect();
        let ys: Vec<f64> = data.iter().map(|&v| v as f64).collect();
        regressao_linear(&xs, &ys).map(|(a, _b)| a.round() as i32)
    };

    let tendencia_ganhos = match projecao_metodo.as_str() {
        "media_movel_3" => media_movel(&ganhos_7dias, 3),
        "media_movel_7" => media_movel(&ganhos_7dias, 7),
        "media_movel_30" => media_movel(&ganhos_mes, 30),
        "regressao_linear" => trend_regression_from_i32(&ganhos_7dias),
        _ => None,
    };

    let tendencia_gastos = match projecao_metodo.as_str() {
        "media_movel_3" => media_movel(&gastos_7dias, 3),
        "media_movel_7" => media_movel(&gastos_7dias, 7),
        "media_movel_30" => media_movel(&gastos_mes, 30),
        "regressao_linear" => trend_regression_from_i32(&gastos_7dias),
        _ => None,
    };
    let corridas_7dias_i32: Vec<i32> = corridas_7dias.iter().map(|&v| v as i32).collect();
    let corridas_30dias_i32: Vec<i32> = corridas_30dias.iter().map(|&v| v as i32).collect();

    let tendencia_corridas = match projecao_metodo.as_str() {
        "media_movel_3" => media_movel(&corridas_7dias_i32, 3),
        "media_movel_7" => media_movel(&corridas_7dias_i32, 7),
        "media_movel_30" => media_movel(&corridas_30dias_i32, 30),
        "regressao_linear" => trend_regression_from_i32(&corridas_7dias_i32),
        _ => None,
    };

    // Datas para períodos
    let hoje = now.date();
    let ontem = hoje - Duration::days(1);
    let inicio_hoje = Utc.from_utc_datetime(&hoje.and_hms_opt(0,0,0).unwrap());
    let fim_hoje = Utc.from_utc_datetime(&hoje.and_hms_opt(23,59,59).unwrap());
    let inicio_ontem = Utc.from_utc_datetime(&ontem.and_hms_opt(0,0,0).unwrap());
    let fim_ontem = Utc.from_utc_datetime(&ontem.and_hms_opt(23,59,59).unwrap());

    let inicio_7dias = now - Duration::days(7);
    let fim_7dias = now;
    let inicio_7dias_ndt = Utc.from_utc_datetime(&inicio_7dias.date().and_hms_opt(0,0,0).unwrap());
    let fim_7dias_ndt = Utc.from_utc_datetime(&fim_7dias.date().and_hms_opt(23,59,59).unwrap());

    let inicio_30dias = now - Duration::days(30);
    let fim_30dias = now;
    let inicio_30dias_ndt = Utc.from_utc_datetime(&inicio_30dias.date().and_hms_opt(0,0,0).unwrap());
    let fim_30dias_ndt = Utc.from_utc_datetime(&fim_30dias.date().and_hms_opt(23,59,59).unwrap());

    let inicio_semana = hoje - Duration::days(hoje.weekday().num_days_from_monday() as i64);
    let fim_semana = inicio_semana + Duration::days(6);
    let inicio_semana_ndt = Utc.from_utc_datetime(&inicio_semana.and_hms_opt(0,0,0).unwrap());
    let fim_semana_ndt = Utc.from_utc_datetime(&fim_semana.and_hms_opt(23,59,59).unwrap());

    let inicio_semana_passada = inicio_semana - Duration::days(7);
    let fim_semana_passada = inicio_semana - Duration::days(1);
    let inicio_semana_passada_ndt = Utc.from_utc_datetime(&inicio_semana_passada.and_hms_opt(0,0,0).unwrap());
    let fim_semana_passada_ndt = Utc.from_utc_datetime(&fim_semana_passada.and_hms_opt(23,59,59).unwrap());

    let mes = hoje.month();
    let ano = hoje.year();
    let inicio_mes = chrono::NaiveDate::from_ymd_opt(ano, mes, 1).unwrap();
    let dias_mes = chrono::NaiveDate::from_ymd_opt(ano, mes % 12 + 1, 1).unwrap_or_else(|| chrono::NaiveDate::from_ymd_opt(ano + 1, 1, 1).unwrap()).signed_duration_since(inicio_mes).num_days();
    let fim_mes = inicio_mes + Duration::days(dias_mes - 1);
    let inicio_mes_ndt = Utc.from_utc_datetime(&inicio_mes.and_hms_opt(0,0,0).unwrap());
    let fim_mes_ndt = Utc.from_utc_datetime(&fim_mes.and_hms_opt(23,59,59).unwrap());

    let mes_passado = if mes == 1 { 12 } else { mes - 1 };
    let ano_mes_passado = if mes == 1 { ano - 1 } else { ano };
    let inicio_mes_passado = chrono::NaiveDate::from_ymd_opt(ano_mes_passado, mes_passado, 1).unwrap();
    let dias_mes_passado = chrono::NaiveDate::from_ymd_opt(ano_mes_passado, mes_passado % 12 + 1, 1).unwrap_or_else(|| chrono::NaiveDate::from_ymd_opt(ano_mes_passado + 1, 1, 1).unwrap()).signed_duration_since(inicio_mes_passado).num_days();
    let fim_mes_passado = inicio_mes_passado + Duration::days(dias_mes_passado - 1);
    let inicio_mes_passado_ndt = Utc.from_utc_datetime(&inicio_mes_passado.and_hms_opt(0,0,0).unwrap());
    let fim_mes_passado_ndt = Utc.from_utc_datetime(&fim_mes_passado.and_hms_opt(23,59,59).unwrap());

    // construir mapa de platforms
    let mut platforms_map: HashMap<String, PlatformResult> = HashMap::new();
    let platform_names = ["Corrida Uber".to_string(), "Corrida 99".to_string()];
    for name in platform_names.iter() {
        use crate::schema::categorias::dsl as cat_dsl;
        let categorias: Vec<crate::models::Categoria> = cat_dsl::categorias
            .filter(cat_dsl::id_usuario.eq(Some(id_usuario.to_string())))
            .filter(cat_dsl::nome.eq(name))
            .load::<crate::models::Categoria>(conn)
            .unwrap_or_default();
        let cat_ids: Vec<String> = categorias.iter().map(|c| c.id.clone()).collect();

        let ganhos_p: i32 = if cat_ids.is_empty() {
            0
        } else {
            transacao_dsl::transacoes
                .filter(transacao_dsl::id_usuario.eq(id_usuario))
                .filter(transacao_dsl::data.ge(inicio_hoje))
                .filter(transacao_dsl::data.le(fim_hoje))
                .filter(transacao_dsl::tipo.eq("entrada"))
                .filter(transacao_dsl::id_categoria.eq_any(cat_ids.clone()))
                .select(diesel::dsl::sum(transacao_dsl::valor))
                .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32
        };
        let corridas_i64: i64 = if cat_ids.is_empty() {
            0
        } else {
            transacao_dsl::transacoes
                .filter(transacao_dsl::id_usuario.eq(id_usuario))
                .filter(transacao_dsl::data.ge(inicio_hoje))
                .filter(transacao_dsl::data.le(fim_hoje))
                .filter(transacao_dsl::tipo.eq("entrada"))
                .filter(transacao_dsl::id_categoria.eq_any(cat_ids.clone()))
                .select(diesel::dsl::sum(transacao_dsl::eventos))
                .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0)
        };
        let corridas_p: u32 = corridas_i64.try_into().unwrap_or(0);
        let (icone, cor) = categorias.first().map(|c| (c.icone.clone(), c.cor.clone())).unwrap_or((None, None));
        platforms_map.insert(name.clone(), PlatformResult { ganhos: ganhos_p, corridas: corridas_p, icone, cor, periodo: "hoje".to_string() });
    }

    // obter top sources (receitas e despesas)
    let mut receitas: Vec<TopSourceItem> = Vec::new();
    let mut despesas: Vec<TopSourceItem> = Vec::new();

    let mut r_today = top_source_for_period("entrada", inicio_hoje, fim_hoje, id_usuario, conn);
    r_today.periodo = "diario".to_string();
    receitas.push(r_today);
    let mut r_7 = top_source_for_period("entrada", inicio_7dias_ndt, fim_7dias_ndt, id_usuario, conn);
    r_7.periodo = "7dias".to_string();
    receitas.push(r_7);
    let mut r_30 = top_source_for_period("entrada", inicio_30dias_ndt, fim_30dias_ndt, id_usuario, conn);
    r_30.periodo = "30dias".to_string();
    receitas.push(r_30);

    let mut d_today = top_source_for_period("saida", inicio_hoje, fim_hoje, id_usuario, conn);
    d_today.periodo = "diario".to_string();
    despesas.push(d_today);
    let mut d_7 = top_source_for_period("saida", inicio_7dias_ndt, fim_7dias_ndt, id_usuario, conn);
    d_7.periodo = "7dias".to_string();
    despesas.push(d_7);
    let mut d_30 = top_source_for_period("saida", inicio_30dias_ndt, fim_30dias_ndt, id_usuario, conn);
    d_30.periodo = "30dias".to_string();
    despesas.push(d_30);

    let top_sources = TopSources { receitas, despesas };

    // finalmente montar stats incluindo platforms
    DashboardStats {
        ganhos_hoje: soma_periodo("entrada", id_usuario, inicio_hoje, fim_hoje, conn),
        ganhos_ontem: soma_periodo("entrada", id_usuario, inicio_ontem, fim_ontem, conn),
        ganhos_semana: soma_periodo("entrada", id_usuario, inicio_semana_ndt, fim_semana_ndt, conn),
        ganhos_semana_passada: soma_periodo("entrada", id_usuario, inicio_semana_passada_ndt, fim_semana_passada_ndt, conn),
        ganhos_mes: soma_periodo("entrada", id_usuario, inicio_mes_ndt, fim_mes_ndt, conn),
        ganhos_mes_passado: soma_periodo("entrada", id_usuario, inicio_mes_passado_ndt, fim_mes_passado_ndt, conn),

        gastos_hoje: soma_periodo("saida", id_usuario, inicio_hoje, fim_hoje, conn),
        gastos_ontem: soma_periodo("saida", id_usuario, inicio_ontem, fim_ontem, conn),
        gastos_semana: soma_periodo("saida", id_usuario, inicio_semana_ndt, fim_semana_ndt, conn),
        gastos_semana_passada: soma_periodo("saida", id_usuario, inicio_semana_passada_ndt, fim_semana_passada_ndt, conn),
        gastos_mes: soma_periodo("saida", id_usuario, inicio_mes_ndt, fim_mes_ndt, conn),
        gastos_mes_passado: soma_periodo("saida", id_usuario, inicio_mes_passado_ndt, fim_mes_passado_ndt, conn),

        lucro_hoje: soma_periodo("entrada", id_usuario, inicio_hoje, fim_hoje, conn).zip(soma_periodo("saida", id_usuario, inicio_hoje, fim_hoje, conn)).map(|(g, s)| g - s),
        lucro_ontem: soma_periodo("entrada", id_usuario, inicio_ontem, fim_ontem, conn).zip(soma_periodo("saida", id_usuario, inicio_ontem, fim_ontem, conn)).map(|(g, s)| g - s),
        lucro_semana: soma_periodo("entrada", id_usuario, inicio_semana_ndt, fim_semana_ndt, conn).zip(soma_periodo("saida", id_usuario, inicio_semana_ndt, fim_semana_ndt, conn)).map(|(g, s)| g - s),
        lucro_semana_passada: soma_periodo("entrada", id_usuario, inicio_semana_passada_ndt, fim_semana_passada_ndt, conn).zip(soma_periodo("saida", id_usuario, inicio_semana_passada_ndt, fim_semana_passada_ndt, conn)).map(|(g, s)| g - s),
        lucro_mes: soma_periodo("entrada", id_usuario, inicio_mes_ndt, fim_mes_ndt, conn).zip(soma_periodo("saida", id_usuario, inicio_mes_ndt, fim_mes_ndt, conn)).map(|(g, s)| g - s),
        lucro_mes_passado: soma_periodo("entrada", id_usuario, inicio_mes_passado_ndt, fim_mes_passado_ndt, conn).zip(soma_periodo("saida", id_usuario, inicio_mes_passado_ndt, fim_mes_passado_ndt, conn)).map(|(g, s)| g - s),

        corridas_hoje: soma_corridas(id_usuario, inicio_hoje, fim_hoje, conn),
        corridas_ontem: soma_corridas(id_usuario, inicio_ontem, fim_ontem, conn),
        corridas_semana: soma_corridas(id_usuario, inicio_semana_ndt, fim_semana_ndt, conn),
        corridas_semana_passada: soma_corridas(id_usuario, inicio_semana_passada_ndt, fim_semana_passada_ndt, conn),
        corridas_mes: soma_corridas(id_usuario, inicio_mes_ndt, fim_mes_ndt, conn),
        corridas_mes_passado: soma_corridas(id_usuario, inicio_mes_passado_ndt, fim_mes_passado_ndt, conn),

        horas_hoje: soma_horas(id_usuario, inicio_hoje, fim_hoje, conn),
        horas_ontem: soma_horas(id_usuario, inicio_ontem, fim_hoje, conn),
        horas_semana: soma_horas(id_usuario, inicio_semana_ndt, fim_semana_ndt, conn),
        horas_semana_passada: soma_horas(id_usuario, inicio_semana_passada_ndt, fim_semana_passada_ndt, conn),
        horas_mes: soma_horas(id_usuario, inicio_mes_ndt, fim_mes_ndt, conn),
        horas_mes_passado: soma_horas(id_usuario, inicio_mes_passado_ndt, fim_mes_passado_ndt, conn),

        eficiencia: Some(eficiencia),
        meta_diaria,
        meta_semanal,
        tendencia_ganhos,
        tendencia_gastos,
        tendencia_corridas,
        ganhos_7dias,
        gastos_7dias,
        lucro_7dias,
        corridas_7dias,
        horas_7dias,
        ultimos_30_dias_labels,
        ganhos_30dias,
        gastos_30dias,
        lucro_30dias,
        corridas_30dias,
        horas_30dias,
        projecao_mes,
        projecao_semana,
        trend_method: projecao_metodo,
        platforms: platforms_map,
        top_sources,
    }
}

// Função pública para computar platforms (migrada do handler anterior)
pub fn compute_platforms(conn: &mut diesel::PgConnection, id_usuario: &str, names_csv: Option<String>) -> HashMap<String, PlatformResult> {
    let now = Local::now().naive_local();
    let hoje = now.date();
    let inicio_hoje = Utc.from_utc_datetime(&hoje.and_hms_opt(0, 0, 0).unwrap());
    let fim_hoje = Utc.from_utc_datetime(&hoje.and_hms_opt(23, 59, 59).unwrap());

    let mut results: HashMap<String, PlatformResult> = HashMap::new();
    if let Some(names_csv) = names_csv {
        let names: Vec<String> = names_csv.split(',').map(|s| s.trim().to_string()).collect();
        for name in names {
            use crate::schema::categorias::dsl as cat_dsl;
            let categorias: Vec<crate::models::Categoria> = cat_dsl::categorias
                .filter(cat_dsl::id_usuario.eq(Some(id_usuario.to_string())))
                .filter(cat_dsl::nome.eq(&name))
                .load::<crate::models::Categoria>(conn)
                .unwrap_or_default();

            let cat_ids: Vec<String> = categorias.iter().map(|c| c.id.clone()).collect();

            let ganhos: i32 = if cat_ids.is_empty() {
                0
            } else {
                transacao_dsl::transacoes
                    .filter(transacao_dsl::id_usuario.eq(id_usuario))
                    .filter(transacao_dsl::data.ge(inicio_hoje))
                    .filter(transacao_dsl::data.le(fim_hoje))
                    .filter(transacao_dsl::tipo.eq("entrada"))
                    .filter(transacao_dsl::id_categoria.eq_any(cat_ids.clone()))
                    .select(diesel::dsl::sum(transacao_dsl::valor))
                    .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32
            };

            let corridas_i64: i64 = if cat_ids.is_empty() {
                0
            } else {
                transacao_dsl::transacoes
                    .filter(transacao_dsl::id_usuario.eq(id_usuario))
                    .filter(transacao_dsl::data.ge(inicio_hoje))
                    .filter(transacao_dsl::data.le(fim_hoje))
                    .filter(transacao_dsl::tipo.eq("entrada"))
                    .filter(transacao_dsl::id_categoria.eq_any(cat_ids.clone()))
                    .select(diesel::dsl::sum(transacao_dsl::eventos))
                    .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0)
            };
            let corridas: u32 = corridas_i64.try_into().unwrap_or(0);
            let (icone, cor) = categorias.first().map(|c| (c.icone.clone(), c.cor.clone())).unwrap_or((None, None));
            let pr = PlatformResult { ganhos, corridas, icone, cor, periodo: "hoje".to_string() };
            results.insert(name.clone(), pr);
        }
    }
    results
}