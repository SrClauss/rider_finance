#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;
    use crate::schema::sessoes_trabalho::dsl::{sessoes_trabalho, id as sessao_id};
    use crate::schema::usuarios::dsl::{usuarios, id as usuario_id};
    use chrono::Utc;
    use diesel::prelude::*;

    #[test]
    fn test_insert_and_query_sessao_trabalho() {
        std::env::set_var("ENVIRONMENT", "tests");
        use crate::models::usuario::NewUsuario;
        let conn = &mut db::establish_connection();
        let now = Utc::now().naive_utc();
        let usuario_id_val = ulid::Ulid::new().to_string();
        let new_user = NewUsuario {
            id: usuario_id_val.clone(),
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

        let nova = NewSessaoTrabalho {
            id: ulid::Ulid::new().to_string(),
            id_usuario: usuario_id_val.clone(),
            inicio: now,
            fim: None,
            total_minutos: Some(60),
            local_inicio: Some("Local A".to_string()),
            local_fim: Some("Local B".to_string()),
            total_corridas: 5,
            total_ganhos: 200,
            total_gastos: 50,
            plataforma: Some("Uber".to_string()),
            observacoes: Some("Teste".to_string()),
            clima: Some("Sol".to_string()),
            eh_ativa: true,
            criado_em: now,
            atualizado_em: now,
        };
        diesel::insert_into(sessoes_trabalho)
            .values(&nova)
            .execute(conn)
            .expect("Erro ao inserir sessao");
        let result = sessoes_trabalho
            .filter(sessao_id.eq(&nova.id))
            .first::<SessaoTrabalho>(conn)
            .expect("Sessao não encontrada");
        assert_eq!(result.id, nova.id);
        assert_eq!(result.total_corridas, 5);
        assert_eq!(result.total_ganhos, 200);

        // Limpa os registros criados
    diesel::delete(sessoes_trabalho.filter(sessao_id.eq(&nova.id))).execute(conn).ok();
    diesel::delete(usuarios.filter(usuario_id.eq(&usuario_id_val))).execute(conn).ok();
    }
}
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use chrono::{NaiveDateTime};
use crate::models::Usuario;
use crate::schema::sessoes_trabalho;


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
