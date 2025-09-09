use crate::schema::usuarios;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use ulid::Ulid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Queryable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = usuarios)]
pub struct Usuario {
    pub id: String,
    pub nome_usuario: String,
    pub email: String,
    pub senha: String,
    pub nome_completo: String,
    pub telefone: String,
    pub veiculo: String,
    pub blocked: bool,
    pub blocked_date: Option<DateTime<Utc>>,
    pub criado_em: DateTime<Utc>,
    pub atualizado_em: DateTime<Utc>,
    pub ultima_tentativa_redefinicao: DateTime<Utc>,
    pub address: String,
    pub address_number: String,
    pub complement: String,
    pub postal_code: String,
    pub province: String,
    pub city: String,
    pub cpfcnpj: String,
}

#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = usuarios)]
pub struct NewUsuario {
    pub id: String,
    pub nome_usuario: String,
    pub email: String,
    pub senha: String,
    pub nome_completo: String,
    pub telefone: String,
    pub veiculo: String,
    pub blocked: bool,
    pub blocked_date: Option<DateTime<Utc>>,
    pub criado_em: DateTime<Utc>,
    pub atualizado_em: DateTime<Utc>,
    pub ultima_tentativa_redefinicao: DateTime<Utc>,
    pub address: String,
    pub address_number: String,
    pub complement: String,
    pub postal_code: String,
    pub province: String,
    pub city: String,
    pub cpfcnpj: String,
}

#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = usuarios)]
pub struct NewUsuarioSemSenha {
    pub id: String,
    pub nome_usuario: String,
    pub email: String,
    pub senha: Option<String>,
    pub nome_completo: Option<String>,
    pub telefone: Option<String>,
    pub veiculo: Option<String>,
    pub criado_em: DateTime<Utc>,
    pub atualizado_em: DateTime<Utc>,
    pub address: String,
    pub address_number: String,
    pub complement: String,
    pub postal_code: String,
    pub province: String,
    pub city: String,
}

impl NewUsuario {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        id: Option<String>,
        nome_usuario: String,
        email: String,
        senha: String,
        nome_completo: String,
        telefone: String,
        veiculo: String,
        criado_em: Option<DateTime<Utc>>,
        atualizado_em: Option<DateTime<Utc>>,
        ultima_tentativa_redefinicao: Option<DateTime<Utc>>,
        address: String,
        address_number: String,
        complement: String,
        postal_code: String,
        province: String,
        city: String,
        cpfcnpj: String,
    ) -> Self {
        let now = chrono::Utc::now();
        let senha_hash = bcrypt::hash(senha, bcrypt::DEFAULT_COST).expect("Erro ao hashear senha");
        NewUsuario {
            id: id.unwrap_or_else(|| Ulid::new().to_string()),
            nome_usuario,
            email,
            senha: senha_hash,
            nome_completo,
            telefone,
            veiculo,
            blocked: false,
            blocked_date: None,
            criado_em: criado_em.unwrap_or(now),
            atualizado_em: atualizado_em.unwrap_or(now),
            ultima_tentativa_redefinicao: ultima_tentativa_redefinicao.unwrap_or(now),
            address,
            address_number,
            complement,
            postal_code,
            province,
            city,
            cpfcnpj,
        }
    }
}

impl NewUsuarioSemSenha {
    pub fn new(nome_usuario: String, email: String) -> Self {
        let now = chrono::Utc::now();
        NewUsuarioSemSenha {
            id: Ulid::new().to_string(),
            nome_usuario,
            email,
            senha: None,
            nome_completo: None,
            telefone: None,
            veiculo: None,
            criado_em: now,
            atualizado_em: now,
            address: "".to_string(),
            address_number: "".to_string(),
            complement: "".to_string(),
            postal_code: "".to_string(),
            province: "".to_string(),
            city: "".to_string(),
        }
    }
}
