use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use ulid::Ulid;
use chrono::{DateTime, Utc};
use crate::schema::transacoes;
use crate::models::{Usuario, Categoria};


#[derive(Debug, Clone, Queryable, Identifiable, Associations, Serialize, Deserialize)]
#[diesel(table_name = transacoes)]
#[diesel(belongs_to(Usuario, foreign_key = id_usuario))]
#[diesel(belongs_to(Categoria, foreign_key = id_categoria))]
pub struct Transacao {
    pub id: String,
    pub id_usuario: String,
    pub id_categoria: String,
    pub valor: i32,
    pub eventos: i32,
    pub km: Option<f64>,
    pub descricao: Option<String>,
    pub tipo: String,
    pub data: DateTime<Utc>,
    pub criado_em: DateTime<Utc>,
    pub atualizado_em: DateTime<Utc>,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = transacoes)]
pub struct NewTransacao {
    pub id: String,
    pub id_usuario: String,
    pub id_categoria: String,
    pub valor: i32,
    pub eventos: i32,
    pub km: Option<f64>,
    pub descricao: Option<String>,
    pub tipo: String,
    pub data: DateTime<Utc>,
    pub criado_em: DateTime<Utc>,
    pub atualizado_em: DateTime<Utc>,
}

impl NewTransacao {
    pub fn new(id_usuario: String, id_categoria: String, valor: i32, tipo: String) -> Self {
        let now = chrono::Utc::now();
        NewTransacao {
            id: Ulid::new().to_string(),
            id_usuario,
            id_categoria,
            valor,
            eventos: 1,
            km: Some(0.0),
            descricao: None,
            tipo,
            data: now,
            criado_em: now,
            atualizado_em: now,
        }
    }
}
