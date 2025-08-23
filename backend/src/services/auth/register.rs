#[cfg(test)]
mod tests {
    use super::*;
    use axum::Json;

    #[tokio::test]
    async fn test_register_user_handler_campos_obrigatorios() {
        std::env::set_var("ENVIRONMENT", "tests");
        let payload = RegisterPayload {
            nome_usuario: "".to_string(),
            email: "".to_string(),
            senha: "".to_string(),
            nome_completo: "".to_string(),
            telefone: "".to_string(),
            veiculo: "".to_string(),
            address: "".to_string(),
            address_number: "".to_string(),
            complement: "".to_string(),
            postal_code: "".to_string(),
            province: "".to_string(),
            city: "".to_string(),
            cpfcnpj: "".to_string(),
            captcha_token: None,
            captcha_answer: None,
        };
        let resp = register_user_handler(Json(payload)).await;
        assert_eq!(resp.status, "erro");
        assert!(resp.mensagem.as_ref().unwrap().contains("obrigatório"));
    }

    #[test]
    fn test_register_user_campos_obrigatorios() {
        std::env::set_var("ENVIRONMENT", "tests");
        let now = chrono::Utc::now().naive_utc();
        let novo_usuario = NewUsuario::new(
            None,
            "".to_string(),
            "".to_string(),
            "".to_string(),
            "".to_string(),
            "".to_string(),
            "".to_string(),
            Some(now),
            Some(now),
            Some(now),
            "".to_string(),
            "".to_string(),
            "".to_string(),
            "".to_string(),
            "".to_string(),
            "".to_string(),
            "".to_string(),
        );
        let result = register_user(novo_usuario);
        assert!(result.is_err());
    }
}
use serde::Deserialize;
#[derive(Deserialize)]
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
        Err(e) => Err(format!("Erro ao registrar usuário de teste: {}", e)),
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
            // Busca todas as configurações padrão (id_usuario == None)
            let padroes: Vec<crate::models::configuracao::Configuracao> = cfg_dsl::configuracoes
                .filter(cfg_dsl::id_usuario.is_null())
                .load(conn)
                .unwrap_or_default();
            let now = Utc::now().naive_utc();
            let novas: Vec<NewConfiguracao> = padroes.into_iter().map(|cfg| NewConfiguracao {
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
            }).collect();
            let _ = diesel::insert_into(cfg_dsl::configuracoes)
                .values(&novas)
                .execute(conn);
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
        .map_err(|e| format!("Erro ao inserir usuário: {}", e))?;
    Ok(novo_usuario.id.clone())
}
