use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use chrono::{NaiveDateTime};
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
    pub data_inicio: NaiveDateTime,
    pub data_fim: Option<NaiveDateTime>,
    pub eh_ativa: bool,
    pub eh_concluida: bool,
    pub concluida_em: Option<NaiveDateTime>,
    pub lembrete_ativo: bool,
    pub frequencia_lembrete: Option<String>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
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
    pub data_inicio: NaiveDateTime,
    pub data_fim: Option<NaiveDateTime>,
    pub eh_ativa: bool,
    pub eh_concluida: bool,
    pub concluida_em: Option<NaiveDateTime>,
    pub lembrete_ativo: bool,
    pub frequencia_lembrete: Option<String>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}
