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
            blocked: false,
            blocked_date: None,
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
use axum_extra::extract::cookie::{Cookie, CookieJar};
use jsonwebtoken::{encode, EncodingKey, Header};
use crate::models::sessao_trabalho::NewSessaoTrabalho;
use crate::schema::sessoes_trabalho::dsl;
use diesel::prelude::*;

use crate::db;

// Ajuste os tipos e funções conforme seu schema real
// Exemplo: insert_transaction(date, value, tipo) e insert_work_session(date, horas)

use crate::services::auth::register::{RegisterPayload, register_user_handler};
use axum::Json;

pub async fn seed_movimentacao_robusta() {
    // Cria um usuário realista usando o fluxo de registro (senha será hasheada)
    let payload = RegisterPayload {
        nome_usuario: "seed_user".to_string(),
        email: "seed_user@teste.com".to_string(),
        senha: "senha123".to_string(),
    nome_completo: "Usuário Seed".to_string(),
    // Telefone e CEP ajustados para formatos aceitos pela Asaas
    telefone: "27998870163".to_string(),
    veiculo: "Carro".to_string(),
        address: "Rua Floriano Peixoto".to_string(),
        address_number: "25".to_string(),
        complement: "casa".to_string(),
        postal_code: "69900100".to_string(),
        province: "Papouco".to_string(),
        city: "Rio Branco".to_string(),
    cpfcnpj: "12345678900".to_string(),
        captcha_token: None,
        captcha_answer: None,
    };
    // Se já existir usuário seed (por email ou nome_usuario), reutiliza e atualiza campos
    use crate::schema::usuarios::dsl::*;
    let conn = &mut db::establish_connection();
    let existing = usuarios
        .filter(email.eq("seed_user@teste.com"))
        .or_filter(nome_usuario.eq("seed_user"))
        .first::<crate::models::usuario::Usuario>(conn)
        .optional()
        .expect("Erro ao buscar usuário seed");

    // Se usuário seed já existir, não faz nada (idempotente e sem alterações)
    if existing.is_some() {
        return;
    }

    // register_user_handler retorna Json<RegisterResponse>, extraímos o inner (.0)
    let resp = register_user_handler(Json(payload)).await;
    let resp_inner = resp.0; // RegisterResponse
    let id_user: String = resp_inner.id.expect("Falha ao criar usuário seed");
    // Cria categorias padrão para o usuário seed: Corrida Uber, Corrida 99, Abastecimento, Alimentação
    use crate::services::categoria::{CreateCategoriaPayload, create_categoria_internal};
    use crate::schema::categorias::dsl as categorias_dsl;
    // Função utilitária local para checar existência por nome e id_usuario
    let id_categoria_uber: String;
    let id_categoria_99: String;
    let id_categoria_abastecimento: String;
    let id_categoria_alimentacao: String;

    // Corrida Uber
    {
        let exists = categorias_dsl::categorias
            .filter(categorias_dsl::nome.eq("Corrida Uber"))
            .filter(categorias_dsl::id_usuario.eq(Some(id_user.clone())))
            .first::<crate::models::Categoria>(conn)
            .optional()
            .expect("Erro ao checar categoria Corrida Uber");
        if let Some(cat) = exists {
            id_categoria_uber = cat.id.clone();
        } else {
            let payload_uber = CreateCategoriaPayload {
                id_usuario: Some(id_user.clone()),
                nome: "Corrida Uber".to_string(),
                tipo: "entrada".to_string(),
                icone: Some("icon-uber".to_string()),
                cor: Some("#000000".to_string()),
            };
            let resp_uber = create_categoria_internal(axum::Json(payload_uber)).await;
            id_categoria_uber = resp_uber.id.clone();
        }
    }

    // Corrida 99
    {
        let exists = categorias_dsl::categorias
            .filter(categorias_dsl::nome.eq("Corrida 99"))
            .filter(categorias_dsl::id_usuario.eq(Some(id_user.clone())))
            .first::<crate::models::Categoria>(conn)
            .optional()
            .expect("Erro ao checar categoria Corrida 99");
        if let Some(cat) = exists {
            id_categoria_99 = cat.id.clone();
        } else {
            let payload_99 = CreateCategoriaPayload {
                id_usuario: Some(id_user.clone()),
                nome: "Corrida 99".to_string(),
                tipo: "entrada".to_string(),
                icone: Some("icon-99".to_string()),
                cor: Some("#111111".to_string()),
            };
            let resp_99 = create_categoria_internal(axum::Json(payload_99)).await;
            id_categoria_99 = resp_99.id.clone();
        }
    }

    // Abastecimento
    {
        let exists = categorias_dsl::categorias
            .filter(categorias_dsl::nome.eq("Abastecimento"))
            .filter(categorias_dsl::id_usuario.eq(Some(id_user.clone())))
            .first::<crate::models::Categoria>(conn)
            .optional()
            .expect("Erro ao checar categoria Abastecimento");
        if let Some(cat) = exists {
            id_categoria_abastecimento = cat.id.clone();
        } else {
            let payload_abastecimento = CreateCategoriaPayload {
                id_usuario: Some(id_user.clone()),
                nome: "Abastecimento".to_string(),
                tipo: "saida".to_string(),
                icone: Some("icon-gas-pump".to_string()),
                cor: Some("#FF9800".to_string()),
            };
            let resp_abaste = create_categoria_internal(axum::Json(payload_abastecimento)).await;
            id_categoria_abastecimento = resp_abaste.id.clone();
        }
    }

    // Alimentação
    {
        let exists = categorias_dsl::categorias
            .filter(categorias_dsl::nome.eq("Alimentação"))
            .filter(categorias_dsl::id_usuario.eq(Some(id_user.clone())))
            .first::<crate::models::Categoria>(conn)
            .optional()
            .expect("Erro ao checar categoria Alimentação");
        if let Some(cat) = exists {
            id_categoria_alimentacao = cat.id.clone();
        } else {
            let payload_alim = CreateCategoriaPayload {
                id_usuario: Some(id_user.clone()),
                nome: "Alimentação".to_string(),
                tipo: "saida".to_string(),
                icone: Some("icon-utensils".to_string()),
                cor: Some("#FF5722".to_string()),
            };
            let resp_alim = create_categoria_internal(axum::Json(payload_alim)).await;
            id_categoria_alimentacao = resp_alim.id.clone();
        }
    }
    // Insere uma assinatura válida para o usuário seed
    {
        use crate::models::assinatura::NewAssinatura;
        use crate::schema::assinaturas::dsl::*;
        let conn = &mut db::establish_connection();
        let now_dt = chrono::Utc::now().naive_utc();
        let periodo_fim_dt = now_dt + Duration::days(30);
        let nova_assinatura = NewAssinatura {
            id: ulid::Ulid::new().to_string(),
            id_usuario: id_user.clone(),
            asaas_subscription_id: "sub_seed_123".to_string(),
            periodo_inicio: now_dt,
            periodo_fim: periodo_fim_dt,
            criado_em: now_dt,
            atualizado_em: now_dt,
        };
        diesel::insert_into(assinaturas)
            .values(&nova_assinatura)
            .execute(conn)
            .expect("Erro ao inserir assinatura seed");
    }
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
        // Gera JWT válido para o usuário seed (usado nas chamadas de create_transacao_handler)
        let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
        let claims = crate::services::transacao::Claims { sub: id_user.clone(), email: "seed_user@teste.com".to_string(), exp: 2000000000 };
        let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_ref())).unwrap();
        let jar = CookieJar::new().add(Cookie::new("auth_token", token));

        for i in 0..entradas {
            let base = if is_weekend { media_entrada as f32 * 0.7 } else { media_entrada as f32 };
            let mut valor_val: f32 = base + rng.random_range(-20.0..20.0) as f32 + rng.random_range(-10.0..10.0) as f32;
            valor_val = valor_val.clamp(15.0, 220.0);
            soma_entradas_val += valor_val;
            // Distribui entre as 2 categorias de entrada
            let categoria_id = if i % 2 == 0 { id_categoria_uber.clone() } else { id_categoria_99.clone() };
            let transacao_payload = CreateTransacaoPayload {
                id_categoria: categoria_id,
                valor: (valor_val * 100.0).round() as i32,
                tipo: "entrada".to_string(),
                descricao: Some("Seed entrada".to_string()),
                data: Some(inicio_val.to_string()),
                eventos: Some(1),
            };
            let _ = create_transacao_handler(jar.clone(), axum::Json(transacao_payload)).await;
        }
        historico_entradas.push(soma_entradas_val as f64);
        let saidas = if cfg!(test) { 1 } else if is_weekend {
            rng.random_range(2..6)
        } else {
            rng.random_range(6..((entradas/2).max(6)))
        };
        for i in 0..saidas {
            let base = if is_weekend { media_saida as f32 * 0.8 } else { media_saida as f32 };
            let mut valor_val: f32 = base + rng.random_range(-15.0..15.0) as f32 + rng.random_range(-5.0..10.0) as f32;
            valor_val = valor_val.clamp(8.0, 130.0);
            soma_saidas_val += valor_val;
            // Distribui entre as 2 categorias de saída
            let categoria_id = if i % 2 == 0 { id_categoria_abastecimento.clone() } else { id_categoria_alimentacao.clone() };
            let transacao_payload = CreateTransacaoPayload {
                id_categoria: categoria_id,
                valor: (valor_val * 100.0).round() as i32,
                tipo: "saida".to_string(),
                descricao: Some("Seed saida".to_string()),
                data: Some(inicio_val.to_string()),
                eventos: Some(1),
            };
            let _ = create_transacao_handler(jar.clone(), axum::Json(transacao_payload)).await;
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
            id_usuario: id_user.clone(),
            inicio: inicio_val,
            fim: fim_val,
            total_minutos: total_minutos_val,
            local_inicio: Some("A".to_string()),
            local_fim: Some("B".to_string()),
            total_corridas: total_corridas_val,
            total_ganhos: (soma_entradas_val * 100.0).round() as i32,
            total_gastos: (soma_saidas_val * 100.0).round() as i32,
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
