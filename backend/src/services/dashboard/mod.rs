/// Calcula a inclinação (a) e o intercepto (b) da reta y = a*x + b para os pontos (x, y)
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
#[cfg(test)]
mod tests {
    use super::*;
    use axum::{extract::Query};
    use axum_extra::extract::cookie::{Cookie, CookieJar};
    use crate::models::{NewUsuario};
    use crate::db::establish_connection;
    use diesel::prelude::*;
    use chrono::{Utc};
    use serial_test::serial;

    fn clean_db() {
        std::env::set_var("ENVIRONMENT", "tests");
        let conn = &mut establish_connection();
        diesel::delete(crate::schema::transacoes::dsl::transacoes).execute(conn).ok();
        diesel::delete(crate::schema::sessoes_trabalho::dsl::sessoes_trabalho).execute(conn).ok();
        diesel::delete(crate::schema::usuarios::dsl::usuarios).execute(conn).ok();
    }

    #[tokio::test]
    #[serial]
    async fn test_dashboard_stats_handler() {
        clean_db();
        let conn = &mut establish_connection();
        // Cria usuário
        let user_id = ulid::Ulid::new().to_string();
    let now = Utc::now().naive_utc();
    let today = now.date();
    let inicio_dia = today.and_hms_opt(0, 0, 0).unwrap();
        let new_user = NewUsuario {
            id: user_id.clone(),
            nome_usuario: "user_dash".to_string(),
            email: "dash@teste.com".to_string(),
            senha: "senha123".to_string(),
            nome_completo: "Dash Test".to_string(),
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
        diesel::insert_into(crate::schema::usuarios::dsl::usuarios).values(&new_user).execute(conn).ok();
    // ...
        // Cria categorias cat1 e cat2
        let now = chrono::Utc::now().naive_utc();
        let cat1 = crate::models::NewCategoria {
            id: "cat1".to_string(),
            id_usuario: Some(user_id.clone()),
            nome: "Categoria Entrada".to_string(),
            tipo: "entrada".to_string(),
            icone: None,
            cor: None,
            criado_em: now,
            atualizado_em: now,
        };
        diesel::insert_into(crate::schema::categorias::dsl::categorias).values(&cat1).execute(conn).ok();
        let cat2 = crate::models::NewCategoria {
            id: "cat2".to_string(),
            id_usuario: Some(user_id.clone()),
            nome: "Categoria Saida".to_string(),
            tipo: "saida".to_string(),
            icone: None,
            cor: None,
            criado_em: now,
            atualizado_em: now,
        };
        diesel::insert_into(crate::schema::categorias::dsl::categorias).values(&cat2).execute(conn).ok();
    // ...

        // Inserir duas transações de entrada: início do dia e now
        for data in [inicio_dia, now] {
            let new_trans = crate::models::NewTransacao {
                id: ulid::Ulid::new().to_string(),
                id_usuario: user_id.clone(),
                id_categoria: "cat1".to_string(),
                valor: 100,
                descricao: Some("Teste entrada".to_string()),
                tipo: "entrada".to_string(),
                data,
                criado_em: data,
                atualizado_em: data,
            };
            diesel::insert_into(crate::schema::transacoes::dsl::transacoes).values(&new_trans).execute(conn).ok();
            // ...
        }
        // Inserir duas transações de saída: início do dia e now
        for data in [inicio_dia, now] {
            let new_trans2 = crate::models::NewTransacao {
                id: ulid::Ulid::new().to_string(),
                id_usuario: user_id.clone(),
                id_categoria: "cat2".to_string(),
                valor: 50,
                descricao: Some("Teste saida".to_string()),
                tipo: "saida".to_string(),
                data,
                criado_em: data,
                atualizado_em: data,
            };
            diesel::insert_into(crate::schema::transacoes::dsl::transacoes).values(&new_trans2).execute(conn).ok();
            // ...
        }
        // Após inserir, buscar e printar todas as transações do usuário no banco para debug
        use diesel::prelude::*;
    let _results: Vec<(String, String, Option<String>, i32, chrono::NaiveDateTime)> = crate::schema::transacoes::dsl::transacoes
            .filter(crate::schema::transacoes::dsl::id_usuario.eq(&user_id))
            .select((
                crate::schema::transacoes::dsl::id,
                crate::schema::transacoes::dsl::tipo,
                crate::schema::transacoes::dsl::descricao,
                crate::schema::transacoes::dsl::valor,
                crate::schema::transacoes::dsl::data,
            ))
            .load::<(String, String, Option<String>, i32, chrono::NaiveDateTime)>(conn)
            .expect("Erro ao buscar transacoes");
        for data in [inicio_dia, now] {
            let new_sessao = crate::models::NewSessaoTrabalho {
                id: ulid::Ulid::new().to_string(),
                id_usuario: user_id.clone(),
                inicio: data,
                fim: Some(data),
                total_minutos: Some(60),
                local_inicio: None,
                local_fim: None,
                total_corridas: 2,
                total_ganhos: 100,
                total_gastos: 50,
                plataforma: None,
                observacoes: None,
                clima: None,
                eh_ativa: false,
                criado_em: data,
                atualizado_em: data,
            };
            diesel::insert_into(crate::schema::sessoes_trabalho::dsl::sessoes_trabalho).values(&new_sessao).execute(conn).ok();
        }
        // Gera token JWT fake
        let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
        let claims = crate::services::dashboard::Claims {
            sub: user_id.clone(),
            email: "dash@teste.com".to_string(),
            exp: 9999999999,
        };
        let token = jsonwebtoken::encode(&jsonwebtoken::Header::default(), &claims, &jsonwebtoken::EncodingKey::from_secret(secret.as_ref())).unwrap();
        let jar = CookieJar::new().add(Cookie::new("auth_token", token));
        let filtro = DashboardFiltro { periodo: None, data_inicio: None, data_fim: None, tipo: None, categoria: None };
        let resp = dashboard_stats_handler(jar, Query(filtro)).await;
        // Verifica se retornou ganhos, gastos e corridas
        assert!(resp.ganhos_hoje.is_some());
        assert!(resp.gastos_hoje.is_some());
        assert!(resp.corridas_hoje.is_some());
    }
}

fn media_movel(data: &[i32], window: usize) -> Option<i32> {
    if data.len() < window || window == 0 {
        return None;
    }
    let sum: i32 = data[data.len()-window..].iter().sum();
    Some(sum / window as i32)
}

// Calcula a média removendo uma porcentagem dos extremos (maiores e menores)
fn media_excluindo_extremos(values: &[i32], percentual_extremos: usize) -> i32 {
    if values.is_empty() {
        return 0;
    }
    let mut v = values.to_vec();
    v.sort();
    let len = v.len();
    let excluir = (len * percentual_extremos / 100).min(len / 2);
    let v_filtrado = if excluir > 0 && len > 2 * excluir {
        v[excluir..len - excluir].to_vec()
    } else {
        v
    };
    if v_filtrado.is_empty() {
        0
    } else {
        v_filtrado.iter().sum::<i32>() / v_filtrado.len() as i32
    }
}

#[cfg(test)]
mod unit_tests {
    use super::*;

    #[test]
    fn test_regressao_linear_simple() {
        let xs = [1.0, 2.0, 3.0, 4.0];
        let ys = [2.0, 4.0, 6.0, 8.0];
        let (a, b) = regressao_linear(&xs, &ys).expect("deveria calcular regressão");
        assert!((a - 2.0).abs() < 1e-6, "a esperado 2.0, got {}", a);
        assert!((b - 0.0).abs() < 1e-6, "b esperado 0.0, got {}", b);
    }

    #[test]
    fn test_regressao_linear_constant() {
        let xs = [1.0, 2.0, 3.0];
        let ys = [5.0, 5.0, 5.0];
        let (a, b) = regressao_linear(&xs, &ys).expect("deveria calcular regressão");
        assert!(a.abs() < 1e-6, "a esperado ~0, got {}", a);
        assert!((b - 5.0).abs() < 1e-6, "b esperado 5.0, got {}", b);
    }

    #[test]
    fn test_media_movel_basic() {
        let data = [1, 2, 3, 4, 5];
        assert_eq!(media_movel(&data, 3), Some((3 + 4 + 5) / 3));
        assert_eq!(media_movel(&data, 5), Some((1 + 2 + 3 + 4 + 5) / 5));
        assert_eq!(media_movel(&data, 6), None);
        assert_eq!(media_movel(&[], 1), None);
    }

    #[test]
    fn test_media_excluindo_extremos_empty() {
        let v: [i32; 0] = [];
        assert_eq!(media_excluindo_extremos(&v, 10), 0);
    }

    #[test]
    fn test_media_excluindo_extremos_no_exclusion() {
        let v = [10, 20, 30, 40];
        assert_eq!(media_excluindo_extremos(&v, 0), (10 + 20 + 30 + 40) / 4);
    }

    #[test]
    fn test_media_excluindo_extremos_with_exclusion() {
        let v = [1, 100, 100, 100, 100, 200];
        // 6 elementos, 25% -> excluir 1 de cada extremidade -> [100,100,100,100] -> média 100
        assert_eq!(media_excluindo_extremos(&v, 25), 100);
    }
}



use axum::{Json};
use axum_extra::extract::cookie::CookieJar;
use axum::extract::Query;
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use chrono::{Utc, Duration, NaiveDateTime, Datelike};
use diesel::prelude::*;
use crate::schema::transacoes::dsl as transacao_dsl;
use crate::schema::sessoes_trabalho::dsl as sessao_dsl;
use crate::schema::metas::dsl as meta_dsl;
use crate::db;
use crate::models::configuracao::Configuracao;
use crate::schema::configuracoes::dsl as config_dsl;

#[derive(Serialize)]
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
    pub ultimos_30_dias_labels: Vec<String>,
    pub ganhos_30dias: Vec<i32>,
    pub gastos_30dias: Vec<i32>,
    pub lucro_30dias: Vec<i32>,
    pub corridas_30dias: Vec<u32>,
    pub projecao_mes: Option<i32>,
    pub projecao_semana: Option<i32>,
    pub trend_method: String,
}

#[derive(Deserialize)]
pub struct DashboardFiltro {
    pub periodo: Option<String>, // "mensal", "semanal", "anual", "custom"
    pub data_inicio: Option<NaiveDateTime>,
    pub data_fim: Option<NaiveDateTime>,
    pub tipo: Option<String>, // "entrada", "saida"
    pub categoria: Option<String>,
}


#[derive(Deserialize, Serialize)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub exp: usize,
}

#[axum::debug_handler]
pub async fn dashboard_stats_handler(
    jar: CookieJar,
    Query(params): Query<DashboardFiltro>
) -> Json<DashboardStats> {
    let conn = &mut db::establish_connection();
    let now = Utc::now().naive_utc();
    // Extrai token do cookie
    let token = jar.get("auth_token").map(|c| c.value().to_string()).unwrap_or_default();

    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let claims = decode::<Claims>(token.as_str(), &DecodingKey::from_secret(secret.as_ref()), &Validation::default())
        .map(|data| data.claims)
        .unwrap_or_else(|_| Claims { sub: "".to_string(), email: "".to_string(), exp: 0 });
    let id_usuario = claims.sub.clone();

    // Buscar configurações do usuário
    let configs: Vec<Configuracao> = config_dsl::configuracoes
        .filter(config_dsl::id_usuario.eq(&id_usuario))
        .load(conn)
        .unwrap_or_default();
    // Função utilitária para buscar config
    let get_config = |chave: &str| -> Option<String> {
        configs.iter().find(|c| c.chave == chave).and_then(|c| c.valor.clone())
    };
    let projecao_metodo = get_config("projecao_metodo").unwrap_or_else(|| "media_movel_3".to_string());
    let projecao_percentual_extremos: usize = get_config("projecao_percentual_extremos").and_then(|v| v.parse().ok()).unwrap_or(10);

    let (inicio, fim) = match params.periodo.as_deref() {
        Some("mensal") => {
            let inicio = NaiveDateTime::new(now.date() - Duration::days(30), chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
            (inicio, now)
        },
        Some("semanal") => {
            let inicio = NaiveDateTime::new(now.date() - Duration::days(7), chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
            (inicio, now)
        },
        Some("anual") => {
            let inicio = NaiveDateTime::new(now.date() - Duration::days(365), chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
            (inicio, now)
        },
        Some("custom") => {
            let inicio = params.data_inicio.unwrap_or(now);
            let fim = params.data_fim.unwrap_or(now);
            (inicio, fim)
        },
        _ => {
            let inicio = NaiveDateTime::new(now.date(), chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
            (inicio, now)
        }
    };

    // Arrays dos últimos 7 dias
    let mut ganhos_7dias = Vec::with_capacity(7);
    let mut gastos_7dias = Vec::with_capacity(7);
    let mut lucro_7dias = Vec::with_capacity(7);
    let mut corridas_7dias = Vec::with_capacity(7);
    for i in (0..7).rev() {
        let dia = now.date() - Duration::days(i);
        let inicio_dia = NaiveDateTime::new(dia, chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
        let fim_dia = NaiveDateTime::new(dia, chrono::NaiveTime::from_hms_opt(23,59,59).unwrap());
        let ganhos_dia: i32 = transacao_dsl::transacoes
            .filter(transacao_dsl::id_usuario.eq(&id_usuario))
            .filter(transacao_dsl::data.ge(inicio_dia))
            .filter(transacao_dsl::data.le(fim_dia))
            .filter(transacao_dsl::tipo.eq("entrada"))
            .select(diesel::dsl::sum(transacao_dsl::valor))
            .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
        let gastos_dia: i32 = transacao_dsl::transacoes
            .filter(transacao_dsl::id_usuario.eq(&id_usuario))
            .filter(transacao_dsl::data.ge(inicio_dia))
            .filter(transacao_dsl::data.le(fim_dia))
            .filter(transacao_dsl::tipo.eq("saida"))
            .select(diesel::dsl::sum(transacao_dsl::valor))
            .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
        let corridas_dia: u32 = sessao_dsl::sessoes_trabalho
            .filter(sessao_dsl::id_usuario.eq(&id_usuario))
            .filter(sessao_dsl::inicio.ge(inicio_dia))
            .filter(sessao_dsl::inicio.le(fim_dia))
            .select(diesel::dsl::sum(sessao_dsl::total_corridas))
            .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0).try_into().unwrap_or(0);
        ganhos_7dias.push(ganhos_dia);
        gastos_7dias.push(gastos_dia);
        lucro_7dias.push(ganhos_dia - gastos_dia);
        corridas_7dias.push(corridas_dia);
    }

    // Arrays dos últimos 30 dias corridos
    let mut ultimos_30_dias_labels = Vec::new();
    let mut ganhos_30dias = Vec::new();
    let mut gastos_30dias = Vec::new();
    let mut lucro_30dias = Vec::new();
    let mut corridas_30dias = Vec::new();
    for i in (0..30).rev() {
        let data_dia = now.date() - chrono::Duration::days(i);
        ultimos_30_dias_labels.push(data_dia.format("%d/%m").to_string());
        let inicio_dia = NaiveDateTime::new(data_dia, chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
        let fim_dia = NaiveDateTime::new(data_dia, chrono::NaiveTime::from_hms_opt(23,59,59).unwrap());
        let ganhos_dia: i32 = transacao_dsl::transacoes
            .filter(transacao_dsl::id_usuario.eq(&id_usuario))
            .filter(transacao_dsl::data.ge(inicio_dia))
            .filter(transacao_dsl::data.le(fim_dia))
            .filter(transacao_dsl::tipo.eq("entrada"))
            .select(diesel::dsl::sum(transacao_dsl::valor))
            .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
        let gastos_dia: i32 = transacao_dsl::transacoes
            .filter(transacao_dsl::id_usuario.eq(&id_usuario))
            .filter(transacao_dsl::data.ge(inicio_dia))
            .filter(transacao_dsl::data.le(fim_dia))
            .filter(transacao_dsl::tipo.eq("saida"))
            .select(diesel::dsl::sum(transacao_dsl::valor))
            .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
        let corridas_dia: u32 = sessao_dsl::sessoes_trabalho
            .filter(sessao_dsl::id_usuario.eq(&id_usuario))
            .filter(sessao_dsl::inicio.ge(inicio_dia))
            .filter(sessao_dsl::inicio.le(fim_dia))
            .select(diesel::dsl::sum(sessao_dsl::total_corridas))
            .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0).try_into().unwrap_or(0);
        ganhos_30dias.push(ganhos_dia);
        gastos_30dias.push(gastos_dia);
        lucro_30dias.push(ganhos_dia - gastos_dia);
        corridas_30dias.push(corridas_dia);
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
        let data_dia = inicio_mes + chrono::Duration::days(i as i64);
        let inicio_dia = NaiveDateTime::new(data_dia, chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
        let fim_dia = NaiveDateTime::new(data_dia, chrono::NaiveTime::from_hms_opt(23,59,59).unwrap());
        let ganhos_dia: i32 = transacao_dsl::transacoes
            .filter(transacao_dsl::id_usuario.eq(&id_usuario))
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
        let data_dia = inicio_semana + chrono::Duration::days(i as i64);
        let inicio_dia = NaiveDateTime::new(data_dia, chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
        let fim_dia = NaiveDateTime::new(data_dia, chrono::NaiveTime::from_hms_opt(23,59,59).unwrap());
        let ganhos_dia: i32 = transacao_dsl::transacoes
            .filter(transacao_dsl::id_usuario.eq(&id_usuario))
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

    let mut ganhos_query = transacao_dsl::transacoes
        .filter(transacao_dsl::id_usuario.eq(&id_usuario))
        .filter(transacao_dsl::data.ge(inicio))
        .filter(transacao_dsl::data.le(fim))
        .filter(transacao_dsl::tipo.eq("entrada"))
        .into_boxed();
    let mut gastos_query = transacao_dsl::transacoes
        .filter(transacao_dsl::id_usuario.eq(&id_usuario))
        .filter(transacao_dsl::data.ge(inicio))
        .filter(transacao_dsl::data.le(fim))
        .filter(transacao_dsl::tipo.eq("saida"))
        .into_boxed();
    if let Some(ref categoria) = params.categoria {
        ganhos_query = ganhos_query.filter(transacao_dsl::id_categoria.eq(categoria));
        gastos_query = gastos_query.filter(transacao_dsl::id_categoria.eq(categoria));
    }
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
        .filter(sessao_dsl::id_usuario.eq(&id_usuario))
        .filter(sessao_dsl::inicio.ge(inicio))
        .filter(sessao_dsl::inicio.le(fim))
        .select(diesel::dsl::sum(sessao_dsl::total_corridas))
        .first::<Option<i64>>(conn)
        .unwrap_or(Some(0))
        .unwrap_or(0)
        .try_into()
        .unwrap_or(0);
    let minutos: i32 = sessao_dsl::sessoes_trabalho.filter(sessao_dsl::id_usuario.eq(&id_usuario)).filter(sessao_dsl::inicio.ge(inicio)).filter(sessao_dsl::inicio.le(fim)).select(diesel::dsl::sum(sessao_dsl::total_minutos)).first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
    let _horas = minutos / 60;
    let total_metas: i32 = meta_dsl::metas.filter(meta_dsl::id_usuario.eq(&id_usuario)).count().get_result::<i64>(conn).unwrap_or(0) as i32;
    let metas_concluidas: i32 = meta_dsl::metas.filter(meta_dsl::id_usuario.eq(&id_usuario)).filter(meta_dsl::eh_concluida.eq(true)).count().get_result::<i64>(conn).unwrap_or(0) as i32;
    let eficiencia = if total_metas > 0 { (metas_concluidas * 100) / total_metas } else { 0 };
    let meta_diaria = meta_dsl::metas.filter(meta_dsl::id_usuario.eq(&id_usuario)).filter(meta_dsl::eh_ativa.eq(true)).order_by(meta_dsl::data_inicio.desc()).select(meta_dsl::valor_alvo).first::<i32>(conn).ok();
    let meta_semanal = meta_dsl::metas.filter(meta_dsl::id_usuario.eq(&id_usuario)).filter(meta_dsl::eh_ativa.eq(true)).order_by(meta_dsl::data_inicio.desc()).select(meta_dsl::valor_alvo).first::<i32>(conn).ok();
    // Arrays dos últimos 7 dias
    let mut ganhos_7dias = Vec::with_capacity(7);
    let mut gastos_7dias = Vec::with_capacity(7);
    let mut lucro_7dias = Vec::with_capacity(7);
    for i in (0..7).rev() {
        let dia = now.date() - Duration::days(i);
        let inicio_dia = NaiveDateTime::new(dia, chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
        let fim_dia = NaiveDateTime::new(dia, chrono::NaiveTime::from_hms_opt(23,59,59).unwrap());
        let ganhos_dia: i32 = transacao_dsl::transacoes
            .filter(transacao_dsl::id_usuario.eq(&id_usuario))
            .filter(transacao_dsl::data.ge(inicio_dia))
            .filter(transacao_dsl::data.le(fim_dia))
            .filter(transacao_dsl::tipo.eq("entrada"))
            .select(diesel::dsl::sum(transacao_dsl::valor))
            .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
        let gastos_dia: i32 = transacao_dsl::transacoes
            .filter(transacao_dsl::id_usuario.eq(&id_usuario))
            .filter(transacao_dsl::data.ge(inicio_dia))
            .filter(transacao_dsl::data.le(fim_dia))
            .filter(transacao_dsl::tipo.eq("saida"))
            .select(diesel::dsl::sum(transacao_dsl::valor))
            .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
        ganhos_7dias.push(ganhos_dia);
        gastos_7dias.push(gastos_dia);
        lucro_7dias.push(ganhos_dia - gastos_dia);
    }

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
            let inicio_dia = NaiveDateTime::new(data_dia, chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
            let fim_dia = NaiveDateTime::new(data_dia, chrono::NaiveTime::from_hms_opt(23,59,59).unwrap());
            let ganhos_dia: i32 = transacao_dsl::transacoes
                .filter(transacao_dsl::id_usuario.eq(&id_usuario))
                .filter(transacao_dsl::data.ge(inicio_dia))
                .filter(transacao_dsl::data.le(fim_dia))
                .filter(transacao_dsl::tipo.eq("entrada"))
                .select(diesel::dsl::sum(transacao_dsl::valor))
                .first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as i32;
            let gastos_dia: i32 = transacao_dsl::transacoes
                .filter(transacao_dsl::id_usuario.eq(&id_usuario))
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
    let tendencia_ganhos = match projecao_metodo.as_str() {
        "media_movel_3" => media_movel(&ganhos_7dias, 3),
        "media_movel_7" => media_movel(&ganhos_7dias, 7),
        "media_movel_30" => media_movel(&ganhos_mes, 30),
        _ => None,
    };
    let tendencia_gastos = match projecao_metodo.as_str() {
        "media_movel_3" => media_movel(&gastos_7dias, 3),
        "media_movel_7" => media_movel(&gastos_7dias, 7),
        "media_movel_30" => media_movel(&gastos_mes, 30),
        _ => None,
    };
    let tendencia_corridas = match projecao_metodo.as_str() {
        "media_movel_3" => media_movel(&lucro_7dias, 3),
        "media_movel_7" => media_movel(&lucro_7dias, 7),
        "media_movel_30" => media_movel(&lucro_mes, 30),
        _ => None,
    };

    // Funções utilitárias para períodos anteriores
    fn soma_periodo(tipo: &str, id_usuario: &str, inicio: NaiveDateTime, fim: NaiveDateTime, conn: &mut diesel::PgConnection) -> Option<i32> {
        use crate::schema::transacoes::dsl as transacao_dsl;
        transacao_dsl::transacoes
            .filter(transacao_dsl::id_usuario.eq(id_usuario))
            .filter(transacao_dsl::data.ge(inicio))
            .filter(transacao_dsl::data.le(fim))
            .filter(transacao_dsl::tipo.eq(tipo))
            .select(diesel::dsl::sum(transacao_dsl::valor))
            .first::<Option<i64>>(conn).ok().flatten().map(|v| v as i32)
    }
    fn soma_corridas(id_usuario: &str, inicio: NaiveDateTime, fim: NaiveDateTime, conn: &mut diesel::PgConnection) -> Option<u32> {
        use crate::schema::sessoes_trabalho::dsl as sessao_dsl;
        sessao_dsl::sessoes_trabalho
            .filter(sessao_dsl::id_usuario.eq(id_usuario))
            .filter(sessao_dsl::inicio.ge(inicio))
            .filter(sessao_dsl::inicio.le(fim))
            .select(diesel::dsl::sum(sessao_dsl::total_corridas))
            .first::<Option<i64>>(conn).ok().flatten().map(|v| v as u32)
    }
    fn soma_horas(id_usuario: &str, inicio: NaiveDateTime, fim: NaiveDateTime, conn: &mut diesel::PgConnection) -> Option<i32> {
        use crate::schema::sessoes_trabalho::dsl as sessao_dsl;
        let minutos = sessao_dsl::sessoes_trabalho
            .filter(sessao_dsl::id_usuario.eq(id_usuario))
            .filter(sessao_dsl::inicio.ge(inicio))
            .filter(sessao_dsl::inicio.le(fim))
            .select(diesel::dsl::sum(sessao_dsl::total_minutos))
            .first::<Option<i64>>(conn).ok().flatten().map(|v| v as i32);
        minutos.map(|m| m / 60)
    }

    // Datas para períodos
    let hoje = now.date();
    let ontem = hoje - Duration::days(1);
    let inicio_hoje = NaiveDateTime::new(hoje, chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
    let fim_hoje = NaiveDateTime::new(hoje, chrono::NaiveTime::from_hms_opt(23,59,59).unwrap());
    let inicio_ontem = NaiveDateTime::new(ontem, chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
    let fim_ontem = NaiveDateTime::new(ontem, chrono::NaiveTime::from_hms_opt(23,59,59).unwrap());

    let inicio_semana = hoje - Duration::days(hoje.weekday().num_days_from_monday() as i64);
    let fim_semana = inicio_semana + Duration::days(6);
    let inicio_semana_ndt = NaiveDateTime::new(inicio_semana, chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
    let fim_semana_ndt = NaiveDateTime::new(fim_semana, chrono::NaiveTime::from_hms_opt(23,59,59).unwrap());

    let inicio_semana_passada = inicio_semana - Duration::days(7);
    let fim_semana_passada = inicio_semana - Duration::days(1);
    let inicio_semana_passada_ndt = NaiveDateTime::new(inicio_semana_passada, chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
    let fim_semana_passada_ndt = NaiveDateTime::new(fim_semana_passada, chrono::NaiveTime::from_hms_opt(23,59,59).unwrap());

    let mes = hoje.month();
    let ano = hoje.year();
    let inicio_mes = chrono::NaiveDate::from_ymd_opt(ano, mes, 1).unwrap();
    let dias_mes = chrono::NaiveDate::from_ymd_opt(ano, mes % 12 + 1, 1).unwrap_or_else(|| chrono::NaiveDate::from_ymd_opt(ano + 1, 1, 1).unwrap()).signed_duration_since(inicio_mes).num_days();
    let fim_mes = inicio_mes + Duration::days(dias_mes - 1);
    let inicio_mes_ndt = NaiveDateTime::new(inicio_mes, chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
    let fim_mes_ndt = NaiveDateTime::new(fim_mes, chrono::NaiveTime::from_hms_opt(23,59,59).unwrap());

    let mes_passado = if mes == 1 { 12 } else { mes - 1 };
    let ano_mes_passado = if mes == 1 { ano - 1 } else { ano };
    let inicio_mes_passado = chrono::NaiveDate::from_ymd_opt(ano_mes_passado, mes_passado, 1).unwrap();
    let dias_mes_passado = chrono::NaiveDate::from_ymd_opt(ano_mes_passado, mes_passado % 12 + 1, 1).unwrap_or_else(|| chrono::NaiveDate::from_ymd_opt(ano_mes_passado + 1, 1, 1).unwrap()).signed_duration_since(inicio_mes_passado).num_days();
    let fim_mes_passado = inicio_mes_passado + Duration::days(dias_mes_passado - 1);
    let inicio_mes_passado_ndt = NaiveDateTime::new(inicio_mes_passado, chrono::NaiveTime::from_hms_opt(0,0,0).unwrap());
    let fim_mes_passado_ndt = NaiveDateTime::new(fim_mes_passado, chrono::NaiveTime::from_hms_opt(23,59,59).unwrap());

    let stats = DashboardStats {
        ganhos_hoje: soma_periodo("entrada", &id_usuario, inicio_hoje, fim_hoje, conn),
        ganhos_ontem: soma_periodo("entrada", &id_usuario, inicio_ontem, fim_ontem, conn),
        ganhos_semana: soma_periodo("entrada", &id_usuario, inicio_semana_ndt, fim_semana_ndt, conn),
        ganhos_semana_passada: soma_periodo("entrada", &id_usuario, inicio_semana_passada_ndt, fim_semana_passada_ndt, conn),
        ganhos_mes: soma_periodo("entrada", &id_usuario, inicio_mes_ndt, fim_mes_ndt, conn),
        ganhos_mes_passado: soma_periodo("entrada", &id_usuario, inicio_mes_passado_ndt, fim_mes_passado_ndt, conn),

        gastos_hoje: soma_periodo("saida", &id_usuario, inicio_hoje, fim_hoje, conn),
        gastos_ontem: soma_periodo("saida", &id_usuario, inicio_ontem, fim_ontem, conn),
        gastos_semana: soma_periodo("saida", &id_usuario, inicio_semana_ndt, fim_semana_ndt, conn),
        gastos_semana_passada: soma_periodo("saida", &id_usuario, inicio_semana_passada_ndt, fim_semana_passada_ndt, conn),
        gastos_mes: soma_periodo("saida", &id_usuario, inicio_mes_ndt, fim_mes_ndt, conn),
        gastos_mes_passado: soma_periodo("saida", &id_usuario, inicio_mes_passado_ndt, fim_mes_passado_ndt, conn),

        lucro_hoje: soma_periodo("entrada", &id_usuario, inicio_hoje, fim_hoje, conn).zip(soma_periodo("saida", &id_usuario, inicio_hoje, fim_hoje, conn)).map(|(g, s)| g - s),
        lucro_ontem: soma_periodo("entrada", &id_usuario, inicio_ontem, fim_ontem, conn).zip(soma_periodo("saida", &id_usuario, inicio_ontem, fim_ontem, conn)).map(|(g, s)| g - s),
        lucro_semana: soma_periodo("entrada", &id_usuario, inicio_semana_ndt, fim_semana_ndt, conn).zip(soma_periodo("saida", &id_usuario, inicio_semana_ndt, fim_semana_ndt, conn)).map(|(g, s)| g - s),
        lucro_semana_passada: soma_periodo("entrada", &id_usuario, inicio_semana_passada_ndt, fim_semana_passada_ndt, conn).zip(soma_periodo("saida", &id_usuario, inicio_semana_passada_ndt, fim_semana_passada_ndt, conn)).map(|(g, s)| g - s),
        lucro_mes: soma_periodo("entrada", &id_usuario, inicio_mes_ndt, fim_mes_ndt, conn).zip(soma_periodo("saida", &id_usuario, inicio_mes_ndt, fim_mes_ndt, conn)).map(|(g, s)| g - s),
        lucro_mes_passado: soma_periodo("entrada", &id_usuario, inicio_mes_passado_ndt, fim_mes_passado_ndt, conn).zip(soma_periodo("saida", &id_usuario, inicio_mes_passado_ndt, fim_mes_passado_ndt, conn)).map(|(g, s)| g - s),

        corridas_hoje: soma_corridas(&id_usuario, inicio_hoje, fim_hoje, conn),
        corridas_ontem: soma_corridas(&id_usuario, inicio_ontem, fim_ontem, conn),
        corridas_semana: soma_corridas(&id_usuario, inicio_semana_ndt, fim_semana_ndt, conn),
        corridas_semana_passada: soma_corridas(&id_usuario, inicio_semana_passada_ndt, fim_semana_passada_ndt, conn),
        corridas_mes: soma_corridas(&id_usuario, inicio_mes_ndt, fim_mes_ndt, conn),
        corridas_mes_passado: soma_corridas(&id_usuario, inicio_mes_passado_ndt, fim_mes_passado_ndt, conn),

        horas_hoje: soma_horas(&id_usuario, inicio_hoje, fim_hoje, conn),
        horas_ontem: soma_horas(&id_usuario, inicio_ontem, fim_ontem, conn),
        horas_semana: soma_horas(&id_usuario, inicio_semana_ndt, fim_semana_ndt, conn),
        horas_semana_passada: soma_horas(&id_usuario, inicio_semana_passada_ndt, fim_semana_passada_ndt, conn),
        horas_mes: soma_horas(&id_usuario, inicio_mes_ndt, fim_mes_ndt, conn),
        horas_mes_passado: soma_horas(&id_usuario, inicio_mes_passado_ndt, fim_mes_passado_ndt, conn),

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
    ultimos_30_dias_labels,
    ganhos_30dias,
    gastos_30dias,
    lucro_30dias,
    corridas_30dias,
    projecao_mes,
    projecao_semana,
    trend_method: projecao_metodo,
    };
    Json(stats)
}

