use diesel::prelude::*;
use serde::{Deserialize, Serialize};

use chrono::{NaiveDateTime};
use crate::models::Usuario;

// Definição da tabela sessoes_trabalho
diesel::table! {
    sessoes_trabalho (id) {
        id -> Text,
        id_usuario -> Text,
        inicio -> Timestamp,
        fim -> Nullable<Timestamp>,
        total_minutos -> Nullable<Integer>,
        local_inicio -> Nullable<Varchar>,
        local_fim -> Nullable<Varchar>,
        total_corridas -> Integer,
        total_ganhos -> Integer,
        total_gastos -> Integer,
        plataforma -> Nullable<Varchar>,
        observacoes -> Nullable<Text>,
        clima -> Nullable<Varchar>,
        eh_ativa -> Bool,
        criado_em -> Timestamp,
        atualizado_em -> Timestamp,
    }
}

#[derive(Debug, Clone, Queryable, Identifiable, Associations, Serialize, Deserialize)]
#[diesel(table_name = sessoes_trabalho)]
#[diesel(belongs_to(Usuario, foreign_key = id_usuario))]
pub struct SessaoTrabalho {
    pub id: String,
    pub id_usuario: String,
    pub inicio: NaiveDateTime,
    pub fim: Option<NaiveDateTime>,
    pub total_minutos: Option<i32>,
    pub local_inicio: Option<String>,
    pub local_fim: Option<String>,
    pub total_corridas: i32,
    pub total_ganhos: i32,
    pub total_gastos: i32,
    pub plataforma: Option<String>,
    pub observacoes: Option<String>,
    pub clima: Option<String>,
    pub eh_ativa: bool,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = sessoes_trabalho)]
pub struct NewSessaoTrabalho {
    pub id: String,
    pub id_usuario: String,
    pub inicio: NaiveDateTime,
    pub fim: Option<NaiveDateTime>,
    pub total_minutos: Option<i32>,
    pub local_inicio: Option<String>,
    pub local_fim: Option<String>,
    pub total_corridas: i32,
    pub total_ganhos: i32,
    pub total_gastos: i32,
    pub plataforma: Option<String>,
    pub observacoes: Option<String>,
    pub clima: Option<String>,
    pub eh_ativa: bool,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}
