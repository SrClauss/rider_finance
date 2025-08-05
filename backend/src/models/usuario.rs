use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use ulid::Ulid;
use chrono::{NaiveDate, NaiveDateTime};

use crate::schema::usuarios;

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
}

#[derive(Debug, Insertable)]
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
}

impl NewUsuario {
    pub fn new(nome_usuario: String, email: String, senha: String) -> Self {
        let now = chrono::Utc::now().naive_utc();
        NewUsuario {
            id: Ulid::new().to_string(),
            nome_usuario,
            email,
            senha,
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
