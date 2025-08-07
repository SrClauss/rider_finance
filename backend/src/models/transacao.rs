use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use ulid::Ulid;
use chrono::{NaiveDateTime};
use crate::models::{Usuario, Categoria};

// Definição da tabela transacoes
diesel::table! {
    transacoes (id) {
        id -> Text,
        id_usuario -> Text,
        id_categoria -> Text,
        valor -> Integer,
        descricao -> Nullable<Text>,
        tipo -> Varchar,
        data -> Timestamp,
        origem -> Nullable<Varchar>,
        id_externo -> Nullable<Varchar>,
        plataforma -> Nullable<Varchar>,
        observacoes -> Nullable<Text>,
        tags -> Nullable<Varchar>,
        criado_em -> Timestamp,
        atualizado_em -> Timestamp,
    }
}

#[derive(Debug, Clone, Queryable, Identifiable, Associations, Serialize, Deserialize)]
#[diesel(table_name = transacoes)]
#[diesel(belongs_to(Usuario, foreign_key = id_usuario))]
#[diesel(belongs_to(Categoria, foreign_key = id_categoria))]
pub struct Transacao {
    pub id: String,
    pub id_usuario: String,
    pub id_categoria: String,
    pub valor: i32,
    pub descricao: Option<String>,
    pub tipo: String,
    pub data: NaiveDateTime,
    pub origem: Option<String>,
    pub id_externo: Option<String>,
    pub plataforma: Option<String>,
    pub observacoes: Option<String>,
    pub tags: Option<String>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = transacoes)]
pub struct NewTransacao {
    pub id: String,
    pub id_usuario: String,
    pub id_categoria: String,
    pub valor: i32,
    pub descricao: Option<String>,
    pub tipo: String,
    pub data: NaiveDateTime,
    pub origem: Option<String>,
    pub id_externo: Option<String>,
    pub plataforma: Option<String>,
    pub observacoes: Option<String>,
    pub tags: Option<String>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}

impl NewTransacao {
    pub fn new(id_usuario: String, id_categoria: String, valor: i32, tipo: String) -> Self {
        let now = chrono::Utc::now().naive_utc();
        NewTransacao {
            id: Ulid::new().to_string(),
            id_usuario,
            id_categoria,
            valor,
            descricao: None,
            tipo,
            data: now,
            origem: None,
            id_externo: None,
            plataforma: None,
            observacoes: None,
            tags: None,
            criado_em: now,
            atualizado_em: now,
        }
    }
}
