use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use crate::models::Usuario;
use crate::schema::sessoes_trabalho;


#[derive(Debug, Clone, Queryable, Identifiable, Associations, Serialize, Deserialize)]
#[diesel(table_name = sessoes_trabalho)]
#[diesel(belongs_to(Usuario, foreign_key = id_usuario))]
pub struct SessaoTrabalho {
    pub id: String,
    pub id_usuario: String,
    pub inicio: DateTime<Utc>,
    pub fim: Option<DateTime<Utc>>,
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
    pub criado_em: DateTime<Utc>,
    pub atualizado_em: DateTime<Utc>,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = sessoes_trabalho)]
pub struct NewSessaoTrabalho {
    pub id: String,
    pub id_usuario: String,
    pub inicio: DateTime<Utc>,
    pub fim: Option<DateTime<Utc>>,
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
    pub criado_em: DateTime<Utc>,
    pub atualizado_em: DateTime<Utc>,
}
