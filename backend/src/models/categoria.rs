use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use ulid::Ulid;
use chrono::NaiveDateTime;

// Definição da tabela categorias
diesel::table! {
    categorias (id) {
        id -> Text,
        id_usuario -> Nullable<Text>,
        nome -> Varchar,
        tipo -> Varchar,
        icone -> Nullable<Varchar>,
        cor -> Nullable<Varchar>,
        eh_padrao -> Bool,
        eh_ativa -> Bool,
        criado_em -> Timestamp,
        atualizado_em -> Timestamp,
    }
}

#[derive(Debug, Clone, Queryable, Identifiable, Associations, Serialize, Deserialize)]
#[diesel(table_name = categorias)]
#[diesel(belongs_to(usuario, foreign_key = id_usuario))]
pub struct Categoria {
    pub id: String,
    pub id_usuario: Option<String>,
    pub nome: String,
    pub tipo: String,
    pub icone: Option<String>,
    pub cor: Option<String>,
    pub eh_padrao: bool,
    pub eh_ativa: bool,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = categorias)]
pub struct NewCategoria {
    pub id: String,
    pub id_usuario: Option<String>,
    pub nome: String,
    pub tipo: String,
    pub icone: Option<String>,
    pub cor: Option<String>,
    pub eh_padrao: bool,
    pub eh_ativa: bool,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}

impl NewCategoria {
    pub fn new(nome: String, tipo: String) -> Self {
        let now = chrono::Utc::now().naive_utc();
        NewCategoria {
            id: Ulid::new().to_string(),
            id_usuario: None,
            nome,
            tipo,
            icone: None,
            cor: None,
            eh_padrao: false,
            eh_ativa: true,
            criado_em: now,
            atualizado_em: now,
        }
    }
}
