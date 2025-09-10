use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use ulid::Ulid;
use chrono::{DateTime, Utc};
use crate::models::Usuario;
use crate::schema::categorias;


#[derive(Debug, Clone, Queryable, Identifiable, Associations, Serialize, Deserialize)]
#[diesel(table_name = categorias)]
#[diesel(belongs_to(Usuario, foreign_key = id_usuario))]
pub struct Categoria {
    pub id: String,
    pub id_usuario: Option<String>,
    pub nome: String,
    pub tipo: String,
    pub icone: Option<String>,
    pub cor: Option<String>,
    pub criado_em: DateTime<Utc>,
    pub atualizado_em: DateTime<Utc>,
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
    pub criado_em: DateTime<Utc>,
    pub atualizado_em: DateTime<Utc>,
}

impl NewCategoria {
    pub fn new(nome: String, tipo: String) -> Self {
        let now = chrono::Utc::now();
        NewCategoria {
            id: Ulid::new().to_string(),
            id_usuario: None,
            nome,
            tipo,
            icone: None,
            cor: None,
            criado_em: now,
            atualizado_em: now,
        }
    }
}
