use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use crate::models::Usuario;
use crate::schema::metas;

#[derive(Debug, Clone, Queryable, Identifiable, Associations, Serialize, Deserialize)]
#[diesel(table_name = metas)]
#[diesel(belongs_to(Usuario, foreign_key = id_usuario))]
pub struct Meta {
    pub id: String,
    pub id_usuario: String,
    pub titulo: String,
    pub descricao: Option<String>,
    pub tipo: String,
    pub categoria: String,
    pub valor_alvo: i32,
    pub valor_atual: i32,
    pub unidade: Option<String>,
    pub data_inicio: DateTime<Utc>,
    pub data_fim: Option<DateTime<Utc>>,
    pub eh_ativa: bool,
    pub eh_concluida: bool,
    pub concluida_em: Option<DateTime<Utc>>,
    pub criado_em: DateTime<Utc>,
    pub atualizado_em: DateTime<Utc>,
    pub concluida_com: Option<i32>,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = metas)]
pub struct NewMeta {
    pub id: String,
    pub id_usuario: String,
    pub titulo: String,
    pub descricao: Option<String>,
    pub tipo: String,
    pub categoria: String,
    pub valor_alvo: i32,
    pub valor_atual: i32,
    pub unidade: Option<String>,
    pub data_inicio: DateTime<Utc>,
    pub data_fim: Option<DateTime<Utc>>,
    pub eh_ativa: bool,
    pub eh_concluida: bool,
    pub concluida_em: Option<DateTime<Utc>>,
    pub criado_em: DateTime<Utc>,
    pub atualizado_em: DateTime<Utc>,
    pub concluida_com: Option<i32>,
}
