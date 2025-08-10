use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use chrono::{NaiveDateTime};
use crate::models::Usuario;
use crate::schema::assinaturas;

#[derive(Debug, Clone, Queryable, Identifiable, Associations, Serialize, Deserialize)]
#[diesel(table_name = assinaturas)]
#[diesel(belongs_to(Usuario, foreign_key = id_usuario))]
pub struct Assinatura {
    pub id: String,
    pub id_usuario: String,
    pub status: String,
    pub asaas_subscription_id: Option<String>,
    pub periodo_inicio: NaiveDateTime,
    pub periodo_fim: NaiveDateTime,
    pub cancelada_em: Option<NaiveDateTime>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
    pub billing_type: Option<String>,
    pub charge_type: Option<String>,
    pub webhook_event_id: Option<String>,
    pub checkout_id: Option<String>,
    pub checkout_status: Option<String>,
    pub checkout_date_created: Option<NaiveDateTime>,
    pub checkout_event_type: Option<String>,
    pub valor: Option<i32>,
    pub descricao: Option<String>,
    pub nome_cliente: Option<String>,
    pub email_cliente: Option<String>,
    pub cpf_cnpj_cliente: Option<String>,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = assinaturas)]
pub struct NewAssinatura {
    pub id: String,
    pub id_usuario: String,
    pub status: String,
    pub asaas_subscription_id: Option<String>,
    pub periodo_inicio: NaiveDateTime,
    pub periodo_fim: NaiveDateTime,
    pub cancelada_em: Option<NaiveDateTime>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
    pub billing_type: Option<String>,
    pub charge_type: Option<String>,
    pub webhook_event_id: Option<String>,
    pub checkout_id: Option<String>,
    pub checkout_status: Option<String>,
    pub checkout_date_created: Option<NaiveDateTime>,
    pub valor: Option<i32>,
    pub checkout_event_type: Option<String>,
    pub descricao: Option<String>,
    pub nome_cliente: Option<String>,
    pub email_cliente: Option<String>,
    pub cpf_cnpj_cliente: Option<String>,
}
