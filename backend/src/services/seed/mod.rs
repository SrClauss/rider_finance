    use crate::db::establish_connection;
    pub fn create_fake_user() -> String {
        use crate::models::usuario::NewUsuario;
        use crate::schema::usuarios::dsl::*;
        let conn = &mut establish_connection();
        let now = chrono::Utc::now().naive_utc();
        let usuario_id = "01K2EX9HFA6JKNWRZ4XF9VZ2PA".to_string();
        let new_user = NewUsuario {
            id: usuario_id.clone(),
            nome_usuario: "Teste".to_string(),
            email: "teste@teste.com".to_string(),
            senha: "teste123".to_string(),
            nome_completo: "Teste da silva".to_string(),
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
// ...teste removido...
use crate::services::transacao::{CreateTransacaoPayload, create_transacao_handler};
use chrono::{Duration, Utc, Datelike, NaiveDateTime, NaiveTime};
use rand::Rng;
use crate::models::sessao_trabalho::NewSessaoTrabalho;
use crate::schema::sessoes_trabalho::dsl;
use diesel::prelude::*;
use crate::db;

// Ajuste os tipos e funções conforme seu schema real
// Exemplo: insert_transaction(date, value, tipo) e insert_work_session(date, horas)

pub async fn seed_movimentacao_robusta() {
    let id_usuario = create_fake_user();
    // Cria categorias de entrada e saída usando o módulo categoria
    use crate::services::categoria::{CreateCategoriaPayload, create_categoria_handler};
    let payload_entrada = CreateCategoriaPayload {
        id_usuario: Some(id_usuario.clone()),
        nome: "Ganhos Seed".to_string(),
        tipo: "entrada".to_string(),
        icone: Some("money".to_string()),
        cor: Some("#4CAF50".to_string()),
        eh_padrao: false,
        eh_ativa: true,
    };
    let response_entrada = create_categoria_handler(axum::Json(payload_entrada)).await;
    let id_categoria_entrada = response_entrada.id.clone();

    let payload_saida = CreateCategoriaPayload {
        id_usuario: Some(id_usuario.clone()),
        nome: "Gastos Seed".to_string(),
        tipo: "saida".to_string(),
        icone: Some("credit-card".to_string()),
        cor: Some("#FF4444".to_string()),
        eh_padrao: false,
        eh_ativa: true,
    };
    let response_saida = create_categoria_handler(axum::Json(payload_saida)).await;
    let id_categoria_saida = response_saida.id.clone();
    // NÃO altere o id_usuario após aqui!
    let mut rng = rand::rng();
    let hoje = Utc::now().date_naive();
    let mut media_entrada = 80.0;
    let mut media_saida = 35.0;
    let mut historico_entradas: Vec<f64> = Vec::new();
    let mut historico_saidas: Vec<f64> = Vec::new();
    // Para teste, reduza para 3 dias
    let dias_loop = if cfg!(test) { 3 } else { 35 };
    for dias_atras in 0..dias_loop {
        let data = hoje - Duration::days(dias_atras);
        let dia_semana = data.weekday().num_days_from_monday();
        let is_weekend = dia_semana >= 5;
        let horas_val: i32 = if is_weekend {
            rng.random_range(2..6)
        } else {
            rng.random_range(6..10)
        };
        let inicio_val = NaiveDateTime::new(data, NaiveTime::from_hms_opt(8, 0, 0).unwrap());
        let fim_hora: u32 = (8 + (horas_val / 2)) as u32;
        let fim_val = Some(NaiveDateTime::new(data, NaiveTime::from_hms_opt(fim_hora, 0, 0).unwrap()));
        let total_minutos_val = Some(horas_val * 60);
    let total_corridas_val = rng.random_range(1..8);
        let mut soma_entradas_val = 0.0_f32;
        let mut soma_saidas_val = 0.0_f32;
        // Para teste, limite o número de transações
        let entradas = if cfg!(test) { 2 } else if is_weekend {
            rng.random_range(5..12)
        } else {
            rng.random_range(15..28)
        };
        for _ in 0..entradas {
            let base = if is_weekend { media_entrada as f32 * 0.7 } else { media_entrada as f32 };
            let mut valor_val: f32 = base + rng.random_range(-20.0..20.0) + rng.random_range(-10.0..10.0);
            valor_val = valor_val.max(15.0).min(220.0);
            soma_entradas_val += valor_val;
            let transacao_payload = CreateTransacaoPayload {
                id_usuario: id_usuario.clone(),
                id_categoria: id_categoria_entrada.clone(),
                valor: valor_val.round() as i32,
                tipo: "entrada".to_string(),
                descricao: Some("Seed entrada".to_string()),
                data: Some(inicio_val),
            };
            let _ = create_transacao_handler(axum::Json(transacao_payload)).await;
        }
        historico_entradas.push(soma_entradas_val as f64);
        let saidas = if cfg!(test) { 1 } else if is_weekend {
            rng.random_range(2..6)
        } else {
            rng.random_range(6..(entradas/2).max(6) as i32)
        };
        for _ in 0..saidas {
            let base = if is_weekend { media_saida as f32 * 0.8 } else { media_saida as f32 };
            let mut valor_val: f32 = base + rng.random_range(-15.0..15.0) + rng.random_range(-5.0..10.0);
            valor_val = valor_val.max(8.0).min(130.0);
            soma_saidas_val += valor_val;
            let transacao_payload = CreateTransacaoPayload {
                id_usuario: id_usuario.clone(),
                id_categoria: id_categoria_saida.clone(),
                valor: valor_val.round() as i32,
                tipo: "saida".to_string(),
                descricao: Some("Seed saida".to_string()),
                data: Some(inicio_val),
            };
            let _ = create_transacao_handler(axum::Json(transacao_payload)).await;
        }
        historico_saidas.push(soma_saidas_val as f64);
        if historico_entradas.len() >= 7 {
            let ultimos7: f64 = historico_entradas.iter().rev().take(7).sum::<f64>() / 7.0;
            media_entrada = (media_entrada * 0.7) + (ultimos7 * 0.3);
        }
        if historico_saidas.len() >= 7 {
            let ultimos7: f64 = historico_saidas.iter().rev().take(7).sum::<f64>() / 7.0;
            media_saida = (media_saida * 0.7) + (ultimos7 * 0.3);
        }
        // Insere a sessão com os totais calculados
        let conn = &mut db::establish_connection();
        let now = chrono::Utc::now().naive_utc();
        let nova_sessao = NewSessaoTrabalho {
            id: ulid::Ulid::new().to_string(),
            id_usuario: id_usuario.clone(),
            inicio: inicio_val,
            fim: fim_val,
            total_minutos: total_minutos_val,
            local_inicio: Some("A".to_string()),
            local_fim: Some("B".to_string()),
            total_corridas: total_corridas_val,
            total_ganhos: soma_entradas_val.round() as i32,
            total_gastos: soma_saidas_val.round() as i32,
            plataforma: Some("Uber".to_string()),
            observacoes: Some("Seed".to_string()),
            clima: Some(if is_weekend { "Sol" } else { "Nublado" }.to_string()),
            eh_ativa: false,
            criado_em: now,
            atualizado_em: now,
        };
        diesel::insert_into(dsl::sessoes_trabalho)
            .values(&nova_sessao)
            .execute(conn)
            .expect("Erro ao inserir sessao_trabalho");
    }
}

// Exemplo de uso no main.rs:
// mod seed;
// fn main() { seed::seed_movimentacao_robusta(); ... }
