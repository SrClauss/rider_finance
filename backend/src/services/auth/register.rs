use serde::Deserialize;
#[derive(Deserialize, Debug)]
pub struct RegisterPayload {
    pub nome_usuario: String,
    pub email: String,
    pub senha: String,
    pub nome_completo: String,
    pub telefone: String,
    pub veiculo: String,
    pub address: String,
    pub address_number: String,
    pub complement: String,
    pub postal_code: String,
    pub province: String,
    pub city: String,
    pub cpfcnpj: String,
    pub captcha_token: Option<String>,
    pub captcha_answer: Option<String>,
}
use diesel::dsl::exists;
use diesel::select;
use diesel::prelude::*;
use crate::db;
use crate::schema::usuarios::dsl::*;
use crate::schema::usuarios::{email, nome_usuario};
use axum::Json;
use serde::Serialize;
use crate::models::NewUsuario;


/// Registra usuário no banco de dados de testes
pub fn register_user_test(novo_usuario: NewUsuario) -> Result<(), String> {
    use crate::db;
    let conn = &mut db::establish_connection();
    match diesel::insert_into(crate::schema::usuarios::table)
        .values(&novo_usuario)
        .execute(conn) {
        Ok(_) => Ok(()),
    Err(e) => Err(format!("Erro ao registrar usuário de teste: {e}")),
    }
}

#[derive(Serialize)]
pub struct RegisterResponse {
    pub status: String,
    pub id: Option<String>,
    pub mensagem: Option<String>,
}

pub async fn register_user_handler(Json(payload): Json<RegisterPayload>) -> Json<RegisterResponse> {
    let usuario = NewUsuario::new(
        None,
        payload.nome_usuario.clone(),
        payload.email.clone(),
        payload.senha.clone(),
        payload.nome_completo.clone(),
        payload.telefone.clone(),
        payload.veiculo.clone(),
        None,
        None,
        Some(chrono::Utc::now().naive_utc()),
        payload.address.clone(),
        payload.address_number.clone(),
        payload.complement.clone(),
        payload.postal_code.clone(),
        payload.province.clone(),
        payload.city.clone(),
        payload.cpfcnpj.clone(),
    );
    match crate::services::auth::register::register_user(usuario) {
        Ok(user_id) => {
            // --- INÍCIO: Cópia de configurações padrão para o novo usuário ---
            use diesel::prelude::*;
            use crate::schema::configuracoes::dsl as cfg_dsl;
            use crate::models::configuracao::NewConfiguracao;
            use chrono::Utc;
            let conn = &mut db::establish_connection();
            // Busca apenas as configurações padrão que devem ser copiadas para o novo usuário
            // Permitimos apenas um conjunto restrito de chaves por segurança/consistência.
            let allowed = vec![
                "projecao_metodo",
                "projecao_percentual_extremos",
                "mask_moeda",
            ];
            let padroes: Vec<crate::models::configuracao::Configuracao> = cfg_dsl::configuracoes
                .filter(cfg_dsl::id_usuario.is_null().and(cfg_dsl::chave.eq_any(&allowed)))
                .load(conn)
                .unwrap_or_default();
            let now = Utc::now().naive_utc();
            // Para idempotência: verifique quais chaves já existem para o usuário e insira apenas as faltantes
            let existing_for_user: Vec<crate::models::configuracao::Configuracao> = cfg_dsl::configuracoes
                .filter(cfg_dsl::id_usuario.eq(Some(user_id.clone())).and(cfg_dsl::chave.eq_any(&allowed)))
                .load(conn)
                .unwrap_or_default();
            let mut present_keys = std::collections::HashSet::new();
            for e in existing_for_user.iter() { present_keys.insert(e.chave.clone()); }

            let mut to_insert: Vec<NewConfiguracao> = Vec::new();
            for cfg in padroes.into_iter() {
                if present_keys.contains(&cfg.chave) {
                    // já existe para o usuário: pular
                    continue;
                }
                to_insert.push(NewConfiguracao {
                    id: ulid::Ulid::new().to_string(),
                    id_usuario: Some(user_id.clone()),
                    chave: cfg.chave,
                    valor: cfg.valor,
                    categoria: cfg.categoria,
                    descricao: cfg.descricao,
                    tipo_dado: cfg.tipo_dado,
                    eh_publica: cfg.eh_publica,
                    criado_em: now,
                    atualizado_em: now,
                });
            }
            if !to_insert.is_empty() {
                let _ = diesel::insert_into(cfg_dsl::configuracoes)
                    .values(&to_insert)
                    .execute(conn);
            }
            // --- INÍCIO: Inserção idempotente de categorias padrão para novo usuário ---
            use crate::schema::categorias::dsl as cat_dsl;
            use crate::models::NewCategoria as NewCat;
            // Só insere se o usuário não tiver categorias
            let existing_cats: Vec<crate::models::categoria::Categoria> = cat_dsl::categorias
                .filter(cat_dsl::id_usuario.eq(Some(user_id.clone())))
                .load(conn)
                .unwrap_or_default();
            if existing_cats.is_empty() {
                let now_cat = now; // já definido acima
                // Apenas as categorias iniciais essenciais para o fluxo de registro.
                // Removido: 'Abastecimento' e 'Alimentação' conforme solicitado.
                let defaults: Vec<NewCat> = vec![
                    NewCat {
                        id: ulid::Ulid::new().to_string(),
                        id_usuario: Some(user_id.clone()),
                        nome: "Corrida Uber".to_string(),
                        tipo: "entrada".to_string(),
                        icone: Some("icon-uber".to_string()),
                        cor: Some("#000000".to_string()),
                        criado_em: now_cat,
                        atualizado_em: now_cat,
                    },
                    NewCat {
                        id: ulid::Ulid::new().to_string(),
                        id_usuario: Some(user_id.clone()),
                        nome: "Corrida 99".to_string(),
                        tipo: "entrada".to_string(),
                        icone: Some("icon-99".to_string()),
                        cor: Some("#111111".to_string()),
                        criado_em: now_cat,
                        atualizado_em: now_cat,
                    },
                ];
                let _ = diesel::insert_into(cat_dsl::categorias).values(&defaults).execute(conn);
            }
            // --- FIM: Inserção de categorias padrão ---
            // --- FIM: Cópia de configurações padrão ---
            Json(RegisterResponse {
                status: "ok".to_string(),
                id: Some(user_id),
                mensagem: None,
            })
        },
        Err(e) => Json(RegisterResponse {
            status: "erro".to_string(),
            id: None,
            mensagem: Some(e),
        }),
    }
}

/// Serviço de registro de usuário já pronto (senha já deve estar hasheada)
pub fn register_user(novo_usuario: NewUsuario) -> Result<String, String> {
    let conn = &mut db::establish_connection();

    // Validação de campos obrigatórios
    if novo_usuario.nome_usuario.trim().is_empty() {
        return Err("Nome de usuário obrigatório".to_string());
    }
    if novo_usuario.email.trim().is_empty() {
        return Err("Email obrigatório".to_string());
    }
    if novo_usuario.senha.trim().is_empty() {
        return Err("Senha obrigatória".to_string());
    }

    // Checagem de unicidade de email e nome_usuario
    if select(exists(usuarios.filter(email.eq(&novo_usuario.email)))).get_result(conn).unwrap_or(false) {
        return Err("Email já cadastrado".to_string());
    }
    if select(exists(usuarios.filter(nome_usuario.eq(&novo_usuario.nome_usuario)))).get_result(conn).unwrap_or(false) {
        return Err("Nome de usuário já cadastrado".to_string());
    }

    diesel::insert_into(usuarios)
        .values(&novo_usuario)
        .execute(conn)
    .map_err(|e| format!("Erro ao inserir usuário: {e}"))?;
    Ok(novo_usuario.id.clone())
}
