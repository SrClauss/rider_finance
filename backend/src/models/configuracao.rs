use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use ulid::Ulid;
use chrono::{NaiveDateTime};

use crate::schema::configuracoes;

#[derive(Debug, Clone, Queryable, Identifiable, Associations, Serialize, Deserialize)]
#[diesel(table_name = configuracoes)]
#[diesel(belongs_to(Usuario, foreign_key = id_usuario))]
pub struct Configuracao {
    pub id: String,
    pub id_usuario: String,
    pub chave: String,
    pub valor: Option<String>,
    pub categoria: Option<String>,
    pub descricao: Option<String>,
    pub tipo_dado: Option<String>,
    pub eh_publica: bool,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = configuracoes)]
pub struct NewConfiguracao {
    pub id: String,
    pub id_usuario: String,
    pub chave: String,
    pub valor: Option<String>,
    pub categoria: Option<String>,
    pub descricao: Option<String>,
    pub tipo_dado: Option<String>,
    pub eh_publica: bool,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}
