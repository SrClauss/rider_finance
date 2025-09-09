use crate::db::establish_connection;
use chrono::{ Datelike, Duration, NaiveTime, TimeZone, Utc };
use rand::Rng;
use diesel::prelude::*;
use crate::db;
use crate::services::auth::register::{ RegisterPayload, register_user_handler };
use crate::services::cpf;
use axum::Json;

pub fn create_fake_user() -> String {
    use crate::models::usuario::NewUsuario;
    use crate::schema::usuarios::dsl::*;
    let conn = &mut establish_connection();
    let now = chrono::Utc::now();
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
    cpfcnpj: cpf::gerar_cpf_valido(),
    };
    diesel::insert_into(usuarios).values(&new_user).execute(conn).expect("Erro ao inserir usuário");
    usuario_id
}

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
    cpfcnpj: cpf::gerar_cpf_valido(),
        captcha_token: None,
        captcha_answer: None,
    };
    // Se já existir usuário seed (por email ou nome_usuario), reutiliza e atualiza campos
    use crate::schema::usuarios::dsl as usuarios_dsl;
    use crate::schema::categorias::dsl as categorias_dsl;
    use crate::schema::assinaturas::dsl as assinaturas_dsl;
  

    let conn = &mut db::establish_connection();

    // Verificar se o usuário seed já existe
    let existing = usuarios_dsl::usuarios
        .filter(usuarios_dsl::email.eq("seed_user@teste.com"))
        .or_filter(usuarios_dsl::nome_usuario.eq("seed_user"))
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
    // Inserir usuário primeiro — tratar falha sem panic
    let id_user: String = match resp_inner.id.clone() {
        Some(id) => id,
        None => {
            // Logar mensagem retornada pelo handler para ajudar a depuração
            eprintln!("Falha ao criar usuário seed: {:?}", resp_inner.mensagem);
            return;
        }
    };

    // Construir todos os registros em memória e inserir em batch sequencialmente
    use crate::models::{NewCategoria, NewSessaoTrabalho, NewTransacao};
    use crate::models::assinatura::NewAssinatura;
    
    // Vetores que irão conter todos os registros a serem inseridos
    let mut batch_categorias: Vec<NewCategoria> = Vec::new();
    let mut batch_assinaturas: Vec<NewAssinatura> = Vec::new();
    let _batch_sessoes: Vec<NewSessaoTrabalho> = Vec::new();
    let mut batch_transacoes: Vec<NewTransacao> = Vec::new();

    // Criar 4 categorias para o usuário seed com IDs conhecidos (ULID)
    let now_ts = chrono::Utc::now();
    let id_categoria_uber = ulid::Ulid::new().to_string();
    let id_categoria_99 = ulid::Ulid::new().to_string();
    let id_categoria_abastecimento = ulid::Ulid::new().to_string();
    let id_categoria_alimentacao = ulid::Ulid::new().to_string();

    // Verificar se as categorias já existem no banco antes de adicioná-las
    use crate::schema::categorias::dsl as cat_check_dsl;
    let existing_categories: Vec<String> = cat_check_dsl::categorias
        .filter(cat_check_dsl::id_usuario.eq(Some(id_user.clone())))
        .select(cat_check_dsl::nome)
        .load::<String>(conn)
        .expect("Erro ao buscar categorias existentes");

    if !existing_categories.contains(&"Corrida Uber".to_string()) {
        batch_categorias.push(NewCategoria {
            id: id_categoria_uber.clone(),
            id_usuario: Some(id_user.clone()),
            nome: "Corrida Uber".to_string(),
            tipo: "entrada".to_string(),
            icone: Some("icon-uber".to_string()),
            cor: Some("#000000".to_string()),
            criado_em: now_ts,
            atualizado_em: now_ts,
        });
    }

    if !existing_categories.contains(&"Corrida 99".to_string()) {
        batch_categorias.push(NewCategoria {
            id: id_categoria_99.clone(),
            id_usuario: Some(id_user.clone()),
            nome: "Corrida 99".to_string(),
            tipo: "entrada".to_string(),
            icone: Some("icon-99".to_string()),
            cor: Some("#111111".to_string()),
            criado_em: now_ts,
            atualizado_em: now_ts,
        });
    }

    if !existing_categories.contains(&"Abastecimento".to_string()) {
        batch_categorias.push(NewCategoria { id: id_categoria_abastecimento.clone(), id_usuario: Some(id_user.clone()), nome: "Abastecimento".to_string(), tipo: "saida".to_string(), icone: Some("icon-gas-pump".to_string()), cor: Some("#FF9800".to_string()), criado_em: now_ts, atualizado_em: now_ts });
    }

    if !existing_categories.contains(&"Alimentação".to_string()) {
        batch_categorias.push(NewCategoria { id: id_categoria_alimentacao.clone(), id_usuario: Some(id_user.clone()), nome: "Alimentação".to_string(), tipo: "saida".to_string(), icone: Some("icon-utensils".to_string()), cor: Some("#FF5722".to_string()), criado_em: now_ts, atualizado_em: now_ts });
    }
    // Inserir uma assinatura válida para o usuário seed no batch
    let now_dt = chrono::Utc::now();
    let periodo_fim_dt = now_dt + Duration::days(30);
    batch_assinaturas.push(NewAssinatura { id: ulid::Ulid::new().to_string(), id_usuario: id_user.clone(), asaas_subscription_id: "sub_seed_123".to_string(), periodo_inicio: now_dt, periodo_fim: periodo_fim_dt, criado_em: now_dt, atualizado_em: now_dt });
    // NÃO altere o id_usuario após aqui!
    let mut rng = rand::rng();
    // Default number of entradas por dia
    let entradas_default: i32 = if cfg!(test) { 2 } else { 10 };
    let hoje = Utc::now().date_naive();
    let mut media_entrada = 80.0;
    let mut media_saida = 35.0;
    let mut historico_entradas: Vec<f64> = Vec::new();
    let mut historico_saidas: Vec<f64> = Vec::new();
    // Para teste, reduza para 3 dias
    let dias_loop = if cfg!(test) { 3 } else { 35 };

    // Persistir categorias e assinaturas antes de gerar transações
    // usar aliases consolidados `categorias_dsl` e `assinaturas_dsl`

    let conn = &mut db::establish_connection();

    // Buscar IDs das categorias Uber e 99 que já foram adicionadas pelo register_user_handler
    let id_categoria_uber_real = categorias_dsl::categorias
        .filter(categorias_dsl::id_usuario.eq(Some(id_user.clone())))
        .filter(categorias_dsl::nome.eq("Corrida Uber"))
        .select(categorias_dsl::id)
        .first::<String>(conn)
        .expect("Categoria Uber não encontrada");

    let id_categoria_99_real = categorias_dsl::categorias
        .filter(categorias_dsl::id_usuario.eq(Some(id_user.clone())))
        .filter(categorias_dsl::nome.eq("Corrida 99"))
        .select(categorias_dsl::id)
        .first::<String>(conn)
        .expect("Categoria 99 não encontrada");

    let id_categoria_abastecimento_real = if existing_categories.contains(&"Abastecimento".to_string()) {
        categorias_dsl::categorias
            .filter(categorias_dsl::id_usuario.eq(Some(id_user.clone())))
            .filter(categorias_dsl::nome.eq("Abastecimento"))
            .select(categorias_dsl::id)
            .first::<String>(conn)
            .expect("Categoria Abastecimento não encontrada")
    } else {
        diesel::insert_into(categorias_dsl::categorias)
            .values(NewCategoria {
                id: id_categoria_abastecimento.clone(),
                id_usuario: Some(id_user.clone()),
                nome: "Abastecimento".to_string(),
                tipo: "saida".to_string(),
                icone: Some("icon-gas-pump".to_string()),
                cor: Some("#FF9800".to_string()),
                criado_em: now_ts,
                atualizado_em: now_ts,
            })
            .returning(categorias_dsl::id)
            .get_result::<String>(conn)
            .expect("Erro ao inserir categoria Abastecimento")
    };

    let id_categoria_alimentacao_real = if existing_categories.contains(&"Alimentação".to_string()) {
        categorias_dsl::categorias
            .filter(categorias_dsl::id_usuario.eq(Some(id_user.clone())))
            .filter(categorias_dsl::nome.eq("Alimentação"))
            .select(categorias_dsl::id)
            .first::<String>(conn)
            .expect("Categoria Alimentação não encontrada")
    } else {
        diesel::insert_into(categorias_dsl::categorias)
            .values(NewCategoria {
                id: id_categoria_alimentacao.clone(),
                id_usuario: Some(id_user.clone()),
                nome: "Alimentação".to_string(),
                tipo: "saida".to_string(),
                icone: Some("icon-utensils".to_string()),
                cor: Some("#FF5722".to_string()),
                criado_em: now_ts,
                atualizado_em: now_ts,
            })
            .returning(categorias_dsl::id)
            .get_result::<String>(conn)
            .expect("Erro ao inserir categoria Alimentação")
    };    let _id_assinatura = diesel::insert_into(assinaturas_dsl::assinaturas)
        .values(NewAssinatura {
            id: ulid::Ulid::new().to_string(),
            id_usuario: id_user.clone(),
            asaas_subscription_id: "sub_seed_123".to_string(),
            periodo_inicio: now_dt,
            periodo_fim: periodo_fim_dt,
            criado_em: now_dt,
            atualizado_em: now_dt,
        })
    .returning(assinaturas_dsl::id)
        .get_result::<String>(conn)
        .expect("Erro ao inserir assinatura");

    // Agora o loop que gera transações pode usar os IDs persistidos
    for dias_atras in 0..dias_loop {
        let data = hoje - Duration::days(dias_atras);
        // calcular inicio_val para este dia às 08:00 UTC
        let inicio_val = chrono::Utc.from_utc_datetime(&chrono::NaiveDateTime::new(data, NaiveTime::from_hms_opt(8, 0, 0).unwrap()));
        let dia_semana = data.weekday().num_days_from_monday();
        let is_weekend = dia_semana >= 5;
        let horas_val: i32 = if is_weekend {
            rng.random_range(2..6)
        } else {
            rng.random_range(6..10)
        };
        let fim_hora: u32 = (8 + horas_val / 2) as u32;

        let fim_val: Option<chrono::DateTime<chrono::Utc>> = Some(
            chrono::Utc.from_utc_datetime(
                &chrono::NaiveDateTime::new(data, NaiveTime::from_hms_opt(fim_hora, 0, 0).unwrap())
            ),
        );
        let total_minutos_val = Some(horas_val * 60);
        let total_corridas_val = rng.random_range(1..8);
        let mut soma_entradas_val = 0.0_f32;
        let mut soma_saidas_val = 0.0_f32;
    // Para teste, limite o número de transações
    let entradas = entradas_default;

        // Collect batch transacoes for this day
        let mut batch_transacoes_day: Vec<crate::models::NewTransacao> = Vec::new();

        for i in 0..entradas {
            let base = if is_weekend { (media_entrada as f32) * 0.7 } else { media_entrada as f32 };
            let mut valor_val: f32 =
                base +
                (rng.random_range(-20.0..20.0) as f32) +
                (rng.random_range(-10.0..10.0) as f32);
            valor_val = valor_val.clamp(15.0, 220.0);
            soma_entradas_val += valor_val;
            // Distribui entre as 2 categorias de entrada
            let categoria_id = if i % 2 == 0 {
                id_categoria_uber_real.clone()
            } else {
                id_categoria_99_real.clone()
            };
            let now = chrono::Utc::now();
            let new_tx = crate::models::NewTransacao {
                id: ulid::Ulid::new().to_string(),
                id_usuario: id_user.clone(),
                id_categoria: categoria_id,
                valor: (valor_val * 100.0).round() as i32,
                eventos: 1,
                tipo: "entrada".to_string(),
                descricao: Some("Seed entrada".to_string()),
                data: inicio_val,
                criado_em: now,
                atualizado_em: now,
            };
            batch_transacoes_day.push(new_tx);
        }

        historico_entradas.push(soma_entradas_val as f64);
        let saidas = if cfg!(test) {
            1
        } else if is_weekend {
            rng.random_range(2..6)
        } else {
            let limite_superior = (entradas / 2).max(6);
            if limite_superior > 6 {
                rng.random_range(6..limite_superior)
            } else {
                6 // Valor padrão para evitar intervalo vazio
            }
        };
        for i in 0..saidas {
            let base = if is_weekend { (media_saida as f32) * 0.8 } else { media_saida as f32 };
            let mut valor_val: f32 =
                base +
                (rng.random_range(-15.0..15.0) as f32) +
                (rng.random_range(-5.0..10.0) as f32);
            valor_val = valor_val.clamp(8.0, 130.0);
            soma_saidas_val += valor_val;
            // Distribui entre as 2 categorias de saída
            let categoria_id = if i % 2 == 0 {
                id_categoria_abastecimento_real.clone()
            } else {
                id_categoria_alimentacao_real.clone()
            };
            let now = chrono::Utc::now();
            let new_tx = crate::models::NewTransacao {
                id: ulid::Ulid::new().to_string(),
                id_usuario: id_user.clone(),
                id_categoria: categoria_id,
                valor: (valor_val * 100.0).round() as i32,
                eventos: 1,
                tipo: "saida".to_string(),
                descricao: Some("Seed saida".to_string()),
                data: inicio_val,
                criado_em: now,
                atualizado_em: now,
            };
            batch_transacoes_day.push(new_tx);
        }
        historico_saidas.push(soma_saidas_val as f64);

    // Append day's transactions to global batch
    batch_transacoes.extend(batch_transacoes_day.into_iter());

        if historico_entradas.len() >= 7 {
            let ultimos7: f64 = historico_entradas.iter().rev().take(7).sum::<f64>() / 7.0;
            media_entrada = media_entrada * 0.7 + ultimos7 * 0.3;
        }
        if historico_saidas.len() >= 7 {
            let ultimos7: f64 = historico_saidas.iter().rev().take(7).sum::<f64>() / 7.0;
            media_saida = media_saida * 0.7 + ultimos7 * 0.3;
        }
        // Insere a sessão com os totais calculados
        let conn = &mut db::establish_connection();
        let now = chrono::Utc::now();
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
            clima: Some((if is_weekend { "Sol" } else { "Nublado" }).to_string()),
            eh_ativa: false,
            criado_em: now,
            atualizado_em: now,
        };
        diesel
            ::insert_into(crate::schema::sessoes_trabalho::dsl::sessoes_trabalho)
            .values(&nova_sessao)
            .execute(conn)
            .expect("Erro ao inserir sessao_trabalho");
    }

    // Após o loop, inserir todas as transações coletadas em batch
    use crate::schema::transacoes::dsl as tx_dsl;
    let conn = &mut db::establish_connection();
    if !batch_transacoes.is_empty() {
        println!("Inserindo {} transacoes em batch", batch_transacoes.len());
        // Inserir em chunks para não exceder o limite de parâmetros do Postgres
        let chunk_size = 2000_usize; // seguro: params por registro ~10 => 2000*10 = 20k < 65535
        for chunk in batch_transacoes.chunks(chunk_size) {
            diesel::insert_into(tx_dsl::transacoes)
                .values(chunk)
                .execute(conn)
                .expect("Erro ao inserir transacoes batch");
        }

        // Atualizar cache para todas as transações inseridas
        for tx in &batch_transacoes {
            let transacao_criada = crate::models::Transacao {
                id: tx.id.clone(),
                id_usuario: tx.id_usuario.clone(),
                id_categoria: tx.id_categoria.clone(),
                valor: tx.valor,
                eventos: tx.eventos,
                descricao: tx.descricao.clone(),
                tipo: tx.tipo.clone(),
                data: tx.data,
                criado_em: tx.criado_em,
                atualizado_em: tx.atualizado_em,
            };
            crate::cache::transacao::add_new_transaction(&tx.id_usuario, transacao_criada).await;
        }
    }

}

// --- Novo handler HTTP para administração: não altera o seed original ---
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct SeedRequest {
    pub nome_usuario: String,
    pub nome_completo: Option<String>,
    pub email: String,
    pub movimentacoes_por_dia: Option<i32>,
    pub meses: Option<i32>,
    pub senha: String,
    pub meses_assinatura: Option<i32>,
    pub gerar_cpf: Option<bool>,
    pub cpf: Option<String>,
}

#[derive(Serialize)]
pub struct UserInfo {
    pub id: String,
    pub nome_usuario: String,
    pub email: String,
    pub cpfcnpj: String,
    pub criado_em: String,
}

#[derive(Serialize)]
pub struct SeedResponse {
    pub status: String,
    pub id: Option<String>,
    pub transacoes_inseridas: Option<usize>,
    pub mensagem: Option<String>,
    pub user: Option<UserInfo>,
}

#[derive(Deserialize)]
pub struct ValidateCpfRequest { pub cpf: String }

#[derive(Serialize)]
pub struct ValidateCpfResponse { pub valid: bool, pub message: Option<String> }

// CPF validation helper
fn cpf_digits_only(s: &str) -> String { s.chars().filter(|c| c.is_ascii_digit()).collect() }

fn validate_cpf_alg(cpf: &str) -> bool {
    let c = cpf_digits_only(cpf);
    if c.len() != 11 { return false; }
    // reject sequences
    if c.chars().all(|ch| ch == c.chars().next().unwrap()) { return false; }
    let nums: Vec<u32> = c.chars().map(|ch| ch.to_digit(10).unwrap()).collect();
    // first digit
    let mut sum = 0u32;
    for i in 0..9 { sum += nums[i] * (10 - i as u32); }
    let mut d1 = 11 - (sum % 11);
    if d1 >= 10 { d1 = 0; }
    if d1 != nums[9] { return false; }
    // second
    let mut sum2 = 0u32;
    for i in 0..10 { sum2 += nums[i] * (11 - i as u32); }
    let mut d2 = 11 - (sum2 % 11);
    if d2 >= 10 { d2 = 0; }
    if d2 != nums[10] { return false; }
    true
}

pub async fn validate_cpf_handler(Json(req): Json<ValidateCpfRequest>) -> Json<ValidateCpfResponse> {
    let ok = validate_cpf_alg(&req.cpf);
    if ok {
        Json(ValidateCpfResponse { valid: true, message: None })
    } else {
        Json(ValidateCpfResponse { valid: false, message: Some("CPF inválido".to_string()) })
    }
}

pub async fn seed_movimentacao_handler(Json(req): Json<SeedRequest>) -> Json<SeedResponse> {
    // Validações: nome, email e senha obrigatórios
    if req.nome_usuario.trim().is_empty() || req.email.trim().is_empty() || req.senha.trim().is_empty() {
        return Json(SeedResponse { status: "error".to_string(), id: None, transacoes_inseridas: None, mensagem: Some("nome_usuario, email e senha são obrigatórios".to_string()), user: None });
    }

    // Defaults numéricos: se não fornecidos, usar 0 (conforme solicitado)
    let entradas_default: i32 = req.movimentacoes_por_dia.unwrap_or(0).max(0).min(100);
    let meses: i32 = req.meses.unwrap_or(0).max(0).min(12);
    let senha_para_registro = req.senha.clone();
    let meses_assinatura: i32 = req.meses_assinatura.unwrap_or(0).max(0).min(24);

    // Recria um payload de registro para usar o fluxo existente
    let cpf_to_use = if req.gerar_cpf.unwrap_or(false) { cpf::gerar_cpf_valido() } else { cpf::gerar_cpf_valido() };

    let payload = RegisterPayload {
        nome_usuario: req.nome_usuario.clone(),
        email: req.email.clone(),
        senha: senha_para_registro.clone(),
        nome_completo: req.nome_completo.clone().unwrap_or_else(|| "Usuário Seed".to_string()),
        telefone: "27998870163".to_string(),
        veiculo: "Carro".to_string(),
        address: "Rua Floriano Peixoto".to_string(),
        address_number: "25".to_string(),
        complement: "casa".to_string(),
        postal_code: "69900100".to_string(),
        province: "Papouco".to_string(),
        city: "Rio Branco".to_string(),
    cpfcnpj: cpf_to_use,
        captcha_token: None,
        captcha_answer: None,
    };

    // Checar existência usuário
    use crate::schema::usuarios::dsl as usuarios_dsl;
    let conn = &mut db::establish_connection();
    let existing = usuarios_dsl::usuarios
        .filter(usuarios_dsl::email.eq(&payload.email))
        .or_filter(usuarios_dsl::nome_usuario.eq(&payload.nome_usuario))
        .first::<crate::models::usuario::Usuario>(conn)
        .optional()
        .expect("Erro ao buscar usuário seed");

    if existing.is_some() {
        return Json(SeedResponse { status: "exists".to_string(), id: existing.map(|u| u.id), transacoes_inseridas: None, mensagem: Some("Usuário já existe".to_string()), user: None });
    }

    // Executa o registro (hash de senha etc.)
    let resp = register_user_handler(Json(payload)).await;
    let resp_inner = resp.0;
    let id_user: String = match resp_inner.id.clone() {
        Some(id) => id,
        None => return Json(SeedResponse { status: "error".to_string(), id: None, transacoes_inseridas: None, mensagem: Some("Falha ao criar usuário".to_string()), user: None }),
    };

    // Agora reaproveita a lógica de geração com parâmetros (sem tocar a função seed existente)
    use crate::models::{NewCategoria, NewSessaoTrabalho, NewTransacao};
    use crate::models::assinatura::NewAssinatura;
    use crate::schema::categorias::dsl as categorias_dsl;
    use crate::schema::categorias::dsl as cat_check_dsl;
    use crate::schema::assinaturas::dsl as assinaturas_dsl;
    use crate::schema::transacoes::dsl as tx_dsl;

    let now_ts = chrono::Utc::now();
    let id_categoria_abastecimento = ulid::Ulid::new().to_string();
    let id_categoria_alimentacao = ulid::Ulid::new().to_string();

    let existing_categories: Vec<String> = cat_check_dsl::categorias
        .filter(cat_check_dsl::id_usuario.eq(Some(id_user.clone())))
        .select(cat_check_dsl::nome)
        .load::<String>(conn)
        .expect("Erro ao buscar categorias existentes");

    let mut batch_categorias: Vec<NewCategoria> = Vec::new();
    if !existing_categories.contains(&"Abastecimento".to_string()) {
        batch_categorias.push(NewCategoria { id: id_categoria_abastecimento.clone(), id_usuario: Some(id_user.clone()), nome: "Abastecimento".to_string(), tipo: "saida".to_string(), icone: Some("icon-gas-pump".to_string()), cor: Some("#FF9800".to_string()), criado_em: now_ts, atualizado_em: now_ts });
    }
    if !existing_categories.contains(&"Alimentação".to_string()) {
        batch_categorias.push(NewCategoria { id: id_categoria_alimentacao.clone(), id_usuario: Some(id_user.clone()), nome: "Alimentação".to_string(), tipo: "saida".to_string(), icone: Some("icon-utensils".to_string()), cor: Some("#FF5722".to_string()), criado_em: now_ts, atualizado_em: now_ts });
    }
    if !batch_categorias.is_empty() {
        diesel::insert_into(categorias_dsl::categorias).values(&batch_categorias).execute(conn).expect("Erro ao inserir categorias batch");
    }

    // Buscar ids das categorias Uber e 99 (inseridas pelo fluxo de registro)
    let id_categoria_uber_real = categorias_dsl::categorias
        .filter(categorias_dsl::id_usuario.eq(Some(id_user.clone())))
        .filter(categorias_dsl::nome.eq("Corrida Uber"))
        .select(categorias_dsl::id)
        .first::<String>(conn)
        .expect("Categoria Uber não encontrada");

    let id_categoria_99_real = categorias_dsl::categorias
        .filter(categorias_dsl::id_usuario.eq(Some(id_user.clone())))
        .filter(categorias_dsl::nome.eq("Corrida 99"))
        .select(categorias_dsl::id)
        .first::<String>(conn)
        .expect("Categoria 99 não encontrada");

    // assinatura
    let now_dt = chrono::Utc::now();
    let periodo_fim_dt = now_dt + Duration::days((meses_assinatura as i64) * 30);
    let _id_assinatura = diesel::insert_into(assinaturas_dsl::assinaturas)
        .values(NewAssinatura { id: ulid::Ulid::new().to_string(), id_usuario: id_user.clone(), asaas_subscription_id: "sub_seed_admin".to_string(), periodo_inicio: now_dt, periodo_fim: periodo_fim_dt, criado_em: now_dt, atualizado_em: now_dt })
        .returning(assinaturas_dsl::id)
        .get_result::<String>(conn)
        .expect("Erro ao inserir assinatura");

    // gerar transacoes (pula se entradas_default == 0 ou meses == 0)
    let mut rng = rand::rng();
    let hoje = Utc::now().date_naive();
    let mut media_entrada = 80.0;
    let mut media_saida = 35.0;
    let mut historico_entradas: Vec<f64> = Vec::new();
    let mut historico_saidas: Vec<f64> = Vec::new();
    let dias_loop = meses * 30;
    let mut batch_transacoes: Vec<NewTransacao> = Vec::new();

    if entradas_default > 0 && meses > 0 {
        for dias_atras in 0..dias_loop {
        let data = hoje - Duration::days(dias_atras as i64);
        let inicio_val = chrono::Utc.from_utc_datetime(&chrono::NaiveDateTime::new(data, NaiveTime::from_hms_opt(8, 0, 0).unwrap()));
        let dia_semana = data.weekday().num_days_from_monday();
        let is_weekend = dia_semana >= 5;
        let horas_val: i32 = if is_weekend { rng.random_range(2..6) } else { rng.random_range(6..10) };
        let fim_hora: u32 = (8 + horas_val / 2) as u32;
        let fim_val: Option<chrono::DateTime<chrono::Utc>> = Some(chrono::Utc.from_utc_datetime(&chrono::NaiveDateTime::new(data, NaiveTime::from_hms_opt(fim_hora, 0, 0).unwrap())));
        let total_minutos_val = Some(horas_val * 60);
        let total_corridas_val = rng.random_range(1..8);
        let mut soma_entradas_val = 0.0_f32;
        let mut soma_saidas_val = 0.0_f32;

        let entradas = entradas_default;
        let mut batch_transacoes_day: Vec<NewTransacao> = Vec::new();
        for i in 0..entradas {
            let base = if is_weekend { (media_entrada as f32) * 0.7 } else { media_entrada as f32 };
            let mut valor_val: f32 = base + (rng.random_range(-20.0..20.0) as f32) + (rng.random_range(-10.0..10.0) as f32);
            valor_val = valor_val.clamp(15.0, 220.0);
            soma_entradas_val += valor_val;
            let categoria_id = if i % 2 == 0 { id_categoria_uber_real.clone() } else { id_categoria_99_real.clone() };
            let now = chrono::Utc::now();
            let new_tx = NewTransacao { id: ulid::Ulid::new().to_string(), id_usuario: id_user.clone(), id_categoria: categoria_id, valor: (valor_val * 100.0).round() as i32, eventos: 1, tipo: "entrada".to_string(), descricao: Some("Seed entrada".to_string()), data: inicio_val, criado_em: now, atualizado_em: now };
            batch_transacoes_day.push(new_tx);
        }
        historico_entradas.push(soma_entradas_val as f64);

        let saidas = if is_weekend { rng.random_range(2..6) } else { let limite_superior = (entradas / 2).max(6); if limite_superior > 6 { rng.random_range(6..limite_superior) } else { 6 } };
        for i in 0..saidas {
            let base = if is_weekend { (media_saida as f32) * 0.8 } else { media_saida as f32 };
            let mut valor_val: f32 = base + (rng.random_range(-15.0..15.0) as f32) + (rng.random_range(-5.0..10.0) as f32);
            valor_val = valor_val.clamp(8.0, 130.0);
            soma_saidas_val += valor_val;
            // para categorias de saida, preferir as já existentes ou usar os ids gerados localmente
            let categoria_id = if i % 2 == 0 {
                // tenta obter existente Abastecimento
                if existing_categories.contains(&"Abastecimento".to_string()) {
                    categorias_dsl::categorias.filter(categorias_dsl::id_usuario.eq(Some(id_user.clone()))).filter(categorias_dsl::nome.eq("Abastecimento")).select(categorias_dsl::id).first::<String>(conn).unwrap_or(id_categoria_abastecimento.clone())
                } else { id_categoria_abastecimento.clone() }
            } else {
                if existing_categories.contains(&"Alimentação".to_string()) {
                    categorias_dsl::categorias.filter(categorias_dsl::id_usuario.eq(Some(id_user.clone()))).filter(categorias_dsl::nome.eq("Alimentação")).select(categorias_dsl::id).first::<String>(conn).unwrap_or(id_categoria_alimentacao.clone())
                } else { id_categoria_alimentacao.clone() }
            };
            let now = chrono::Utc::now();
            let new_tx = NewTransacao { id: ulid::Ulid::new().to_string(), id_usuario: id_user.clone(), id_categoria: categoria_id, valor: (valor_val * 100.0).round() as i32, eventos: 1, tipo: "saida".to_string(), descricao: Some("Seed saida".to_string()), data: inicio_val, criado_em: now, atualizado_em: now };
            batch_transacoes_day.push(new_tx);
        }
        historico_saidas.push(soma_saidas_val as f64);
        batch_transacoes.extend(batch_transacoes_day.into_iter());

        if historico_entradas.len() >= 7 { let ultimos7: f64 = historico_entradas.iter().rev().take(7).sum::<f64>() / 7.0; media_entrada = media_entrada * 0.7 + ultimos7 * 0.3; }
        if historico_saidas.len() >= 7 { let ultimos7: f64 = historico_saidas.iter().rev().take(7).sum::<f64>() / 7.0; media_saida = media_saida * 0.7 + ultimos7 * 0.3; }

        // insere sessao
        let conn = &mut db::establish_connection();
        let now = chrono::Utc::now();
        let nova_sessao = NewSessaoTrabalho { id: ulid::Ulid::new().to_string(), id_usuario: id_user.clone(), inicio: inicio_val, fim: fim_val, total_minutos: total_minutos_val, local_inicio: Some("A".to_string()), local_fim: Some("B".to_string()), total_corridas: total_corridas_val, total_ganhos: (soma_entradas_val * 100.0).round() as i32, total_gastos: (soma_saidas_val * 100.0).round() as i32, plataforma: Some("Uber".to_string()), observacoes: Some("Seed".to_string()), clima: Some((if is_weekend { "Sol" } else { "Nublado" }).to_string()), eh_ativa: false, criado_em: now, atualizado_em: now };
        diesel::insert_into(crate::schema::sessoes_trabalho::dsl::sessoes_trabalho).values(&nova_sessao).execute(conn).expect("Erro ao inserir sessao_trabalho");
        }
    }

    // inserir transacoes em batch
    let conn = &mut db::establish_connection();
    if !batch_transacoes.is_empty() {
        // Inserir em chunks para evitar estourar limite de parâmetros
        let chunk_size = 2000_usize;
        for chunk in batch_transacoes.chunks(chunk_size) {
            diesel::insert_into(tx_dsl::transacoes)
                .values(chunk)
                .execute(conn)
                .expect("Erro ao inserir transacoes batch");
        }
    }

    let inserted = batch_transacoes.len();
    // Tenta buscar o usuário criado para retornar dados completos
    let conn = &mut db::establish_connection();
    let user_row = usuarios_dsl::usuarios
        .filter(usuarios_dsl::id.eq(&id_user))
        .first::<crate::models::usuario::Usuario>(conn)
        .optional()
        .ok()
        .flatten();

    let user_info = user_row.map(|u| UserInfo {
        id: u.id,
        nome_usuario: u.nome_usuario,
        email: u.email,
        cpfcnpj: u.cpfcnpj,
        criado_em: u.criado_em.to_rfc3339(),
    });

    Json(SeedResponse { status: "ok".to_string(), id: Some(id_user), transacoes_inseridas: Some(inserted), mensagem: None, user: user_info })
}
