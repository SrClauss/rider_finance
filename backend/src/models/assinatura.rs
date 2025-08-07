use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use chrono::{NaiveDateTime};
use crate::models::Usuario;

// Definição da tabela assinaturas
diesel::table! {
    assinaturas (id) {
        id -> Text,
        id_usuario -> Text,
        tipo_plano -> Varchar,
        status -> Varchar,
        asaas_customer_id -> Varchar,
        asaas_subscription_id -> Nullable<Varchar>,
        periodo_inicio -> Timestamp,
        periodo_fim -> Timestamp,
        cancelada_em -> Nullable<Timestamp>,
        criado_em -> Timestamp,
        atualizado_em -> Timestamp,
    }
}

#[derive(Debug, Clone, Queryable, Identifiable, Associations, Serialize, Deserialize)]
#[diesel(table_name = assinaturas)]
#[diesel(belongs_to(Usuario, foreign_key = id_usuario))]
pub struct Assinatura {
    pub id: String,
    pub id_usuario: String,
    pub tipo_plano: String,
    pub status: String,
    pub asaas_customer_id: String,
    pub asaas_subscription_id: Option<String>,
    pub periodo_inicio: NaiveDateTime,
    pub periodo_fim: NaiveDateTime,
    pub cancelada_em: Option<NaiveDateTime>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = assinaturas)]
pub struct NewAssinatura {
    pub id: String,
    pub id_usuario: String,
    pub tipo_plano: String,
    pub status: String,
    pub asaas_customer_id: String,
    pub asaas_subscription_id: Option<String>,
    pub periodo_inicio: NaiveDateTime,
    pub periodo_fim: NaiveDateTime,
    pub cancelada_em: Option<NaiveDateTime>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}
