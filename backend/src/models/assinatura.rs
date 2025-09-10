use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use crate::models::Usuario;
use crate::schema::assinaturas;

#[derive(Debug, Clone, Queryable, Identifiable, Associations, Serialize, Deserialize, PartialEq)]
#[diesel(table_name = assinaturas)]
#[diesel(belongs_to(Usuario, foreign_key = id_usuario))]
pub struct Assinatura {
    pub id: String,
    pub id_usuario: String,
    pub asaas_subscription_id: String,
    pub periodo_inicio: DateTime<Utc>,
    pub periodo_fim: DateTime<Utc>,
    pub criado_em: DateTime<Utc>,
    pub atualizado_em: DateTime<Utc>,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = assinaturas)]
pub struct NewAssinatura {
    pub id: String,
    pub id_usuario: String,
    pub asaas_subscription_id: String,
    pub periodo_inicio: DateTime<Utc>,
    pub periodo_fim: DateTime<Utc>,
    pub criado_em: DateTime<Utc>,
    pub atualizado_em: DateTime<Utc>,
}
