#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;
    use crate::schema::assinaturas::dsl::*;
    use chrono::Utc;
    use diesel::prelude::*;

    #[test]
    fn test_insert_and_query_assinatura() {
        use crate::models::usuario::NewUsuario;
        use crate::schema::usuarios::dsl::*;
        let conn = &mut db::establish_connection();
        let now = Utc::now().naive_utc();
        let usuario_id = ulid::Ulid::new().to_string();
        let new_user = NewUsuario {
            id: usuario_id.clone(),
            nome_usuario: "user_test".to_string(),
            email: "teste@teste.com".to_string(),
            senha: "senha123".to_string(),
            nome_completo: "Teste".to_string(),
            telefone: "11999999999".to_string(),
            veiculo: "Carro".to_string(),
            criado_em: now,
            atualizado_em: now,
            ultima_tentativa_redefinicao: now,
            address: "Rua Teste".to_string(),
            address_number: "123".to_string(),
            complement: "Apto 1".to_string(),
            postal_code: "01234567".to_string(),
            province: "Centro".to_string(),
            city: "São Paulo".to_string(),
            cpfcnpj: "12345678900".to_string(),
        };
        diesel::insert_into(usuarios)
            .values(&new_user)
            .execute(conn)
            .expect("Erro ao inserir usuário");

        let nova = NewAssinatura {
            id: ulid::Ulid::new().to_string(),
            id_usuario: usuario_id.clone(),
            status: "ativa".to_string(),
            asaas_subscription_id: Some("sub_123".to_string()),
            periodo_inicio: now,
            periodo_fim: now,
            cancelada_em: None,
            criado_em: now,
            atualizado_em: now,
            billing_type: Some("CREDIT_CARD".to_string()),
            charge_type: Some("DETACHED".to_string()),
            webhook_event_id: None,
            checkout_id: Some("chk_123".to_string()),
            checkout_status: Some("pago".to_string()),
            checkout_date_created: Some(now),
            valor: Some(9999),
            checkout_event_type: Some("PAYMENT_RECEIVED".to_string()),
            descricao: Some("Assinatura de teste".to_string()),
            nome_cliente: Some("Teste".to_string()),
            email_cliente: Some("teste@teste.com".to_string()),
            cpf_cnpj_cliente: Some("12345678900".to_string()),
        };
        diesel::insert_into(assinaturas)
            .values(&nova)
            .execute(conn)
            .expect("Erro ao inserir assinatura");
        let result = crate::schema::assinaturas::dsl::assinaturas
            .filter(crate::schema::assinaturas::dsl::id.eq(&nova.id))
            .first::<Assinatura>(conn)
            .expect("Assinatura não encontrada");
        assert_eq!(result.id, nova.id);
        assert_eq!(result.status, "ativa");
        assert_eq!(result.valor, Some(9999));
        assert_eq!(result.nome_cliente, Some("Teste".to_string()));

        // Limpa os registros criados
    diesel::delete(crate::schema::assinaturas::dsl::assinaturas.filter(crate::schema::assinaturas::dsl::id.eq(&nova.id))).execute(conn).ok();
    diesel::delete(crate::schema::usuarios::dsl::usuarios.filter(crate::schema::usuarios::dsl::id.eq(&usuario_id))).execute(conn).ok();
    }
}
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
