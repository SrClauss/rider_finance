use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use ulid::Ulid;
use chrono::{NaiveDate, NaiveDateTime};

// Definição da tabela usuarios
diesel::table! {
    usuarios (id) {
        id -> Text,
        nome_usuario -> Varchar,
        email -> Varchar,
        senha -> Varchar,
        nome_completo -> Nullable<Varchar>,
        telefone -> Nullable<Varchar>,
        veiculo -> Nullable<Varchar>,
        data_inicio_atividade -> Nullable<Date>,
        eh_pago -> Bool,
        id_pagamento -> Nullable<Varchar>,
        metodo_pagamento -> Nullable<Varchar>,
        status_pagamento -> Varchar,
        tipo_assinatura -> Varchar,
        trial_termina_em -> Nullable<Timestamp>,
        criado_em -> Timestamp,
        atualizado_em -> Timestamp,
        ultima_tentativa_redefinicao -> Nullable<Timestamp>,
    }
}

#[derive(Debug, Clone, Queryable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = usuarios)]
pub struct Usuario {
    pub id: String,
    pub nome_usuario: String,
    pub email: String,
    pub senha: String,
    pub nome_completo: Option<String>,
    pub telefone: Option<String>,
    pub veiculo: Option<String>,
    pub data_inicio_atividade: Option<NaiveDate>,
    pub eh_pago: bool,
    pub id_pagamento: Option<String>,
    pub metodo_pagamento: Option<String>,
    pub status_pagamento: String,
    pub tipo_assinatura: String,
    pub trial_termina_em: Option<NaiveDateTime>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
    pub ultima_tentativa_redefinicao: Option<NaiveDateTime>,
}

#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = usuarios)]
pub struct NewUsuario {
    pub id: String,
    pub nome_usuario: String,
    pub email: String,
    pub senha: String,
    pub nome_completo: Option<String>,
    pub telefone: Option<String>,
    pub veiculo: Option<String>,
    pub data_inicio_atividade: Option<NaiveDate>,
    pub eh_pago: bool,
    pub id_pagamento: Option<String>,
    pub metodo_pagamento: Option<String>,
    pub status_pagamento: String,
    pub tipo_assinatura: String,
    pub trial_termina_em: Option<NaiveDateTime>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
    pub ultima_tentativa_redefinicao: Option<NaiveDateTime>,
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
    pub data_inicio_atividade: Option<NaiveDate>,
    pub eh_pago: bool,
    pub id_pagamento: Option<String>,
    pub metodo_pagamento: Option<String>,
    pub status_pagamento: String,
    pub tipo_assinatura: String,
    pub trial_termina_em: Option<NaiveDateTime>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}

impl NewUsuario {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        id: Option<String>,
        nome_usuario: String,
        email: String,
        senha: String,
        nome_completo: Option<String>,
        telefone: Option<String>,
        veiculo: Option<String>,
        data_inicio_atividade: Option<NaiveDate>,
        eh_pago: bool,
        id_pagamento: Option<String>,
        metodo_pagamento: Option<String>,
        status_pagamento: Option<String>,
        tipo_assinatura: Option<String>,
        trial_termina_em: Option<NaiveDateTime>,
        criado_em: Option<NaiveDateTime>,
        atualizado_em: Option<NaiveDateTime>,
    ) -> Self {
        let now = chrono::Utc::now().naive_utc();
        let senha_hash = bcrypt::hash(senha, bcrypt::DEFAULT_COST).expect("Erro ao hashear senha");
        NewUsuario {
            id: id.unwrap_or_else(|| Ulid::new().to_string()),
            nome_usuario,
            email,
            senha: senha_hash,
            nome_completo,
            telefone,
            veiculo,
            data_inicio_atividade,
            eh_pago,
            id_pagamento,
            metodo_pagamento,
            status_pagamento: status_pagamento.unwrap_or_else(|| "pendente".to_string()),
            tipo_assinatura: tipo_assinatura.unwrap_or_else(|| "mensal".to_string()),
            trial_termina_em,
            criado_em: criado_em.unwrap_or(now),
            atualizado_em: atualizado_em.unwrap_or(now),
            ultima_tentativa_redefinicao: None,
        }
    }
}

impl NewUsuarioSemSenha {
    pub fn new(nome_usuario: String, email: String) -> Self {
        let now = chrono::Utc::now().naive_utc();
        NewUsuarioSemSenha {
            id: Ulid::new().to_string(),
            nome_usuario,
            email,
            senha: None,
            nome_completo: None,
            telefone: None,
            veiculo: None,
            data_inicio_atividade: None,
            eh_pago: false,
            id_pagamento: None,
            metodo_pagamento: None,
            status_pagamento: "pendente".to_string(),
            tipo_assinatura: "mensal".to_string(),
            trial_termina_em: None,
            criado_em: now,
            atualizado_em: now,
        }
    }
}
