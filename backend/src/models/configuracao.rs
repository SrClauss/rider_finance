use diesel::Identifiable;
use crate::schema::configuracoes;
use diesel::{Insertable, Queryable};
use chrono::NaiveDateTime;
#[derive(Debug, Clone, Queryable, Identifiable, Insertable)]
#[diesel(table_name = configuracoes)]
pub struct Configuracao {
    pub id: String,
    pub id_usuario: Option<String>,
    pub chave: String,
    pub valor: Option<String>,
    pub categoria: Option<String>,
    pub descricao: Option<String>,
    pub tipo_dado: Option<String>,
    pub eh_publica: bool,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}
#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;
    use crate::schema::configuracoes::dsl::{configuracoes, id as configuracao_id};
    use crate::schema::usuarios::dsl::{id as usuario_id};
    use chrono::Utc;
    use diesel::prelude::*;

    #[test]
    fn test_insert_and_query_configuracao() {
    use crate::models::usuario::NewUsuario;
    use crate::schema::usuarios::dsl::*;
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

        let nova = NewConfiguracao {
            id: ulid::Ulid::new().to_string(),
            id_usuario: Some(usuario_id_val.clone()),
            chave: "chave_teste".to_string(),
            valor: Some("valor_teste".to_string()),
            categoria: Some("cat_teste".to_string()),
            descricao: Some("desc_teste".to_string()),
            tipo_dado: Some("string".to_string()),
            eh_publica: true,
            criado_em: now,
            atualizado_em: now,
        };
        diesel::insert_into(configuracoes)
            .values(&nova)
            .execute(conn)
            .expect("Erro ao inserir configuracao");
        let result = configuracoes
            .filter(configuracao_id.eq(&nova.id))
            .first::<Configuracao>(conn)
            .expect("Configuracao não encontrada");
        assert_eq!(result.id, nova.id);
        assert_eq!(result.chave, "chave_teste");

    diesel::delete(configuracoes.filter(configuracao_id.eq(&nova.id))).execute(conn).expect("Erro ao deletar configuracao");
    diesel::delete(usuarios.filter(usuario_id.eq(&usuario_id_val))).execute(conn).ok();
    }
}

#[derive(Debug, Insertable, Clone)]
#[diesel(table_name = configuracoes)]
pub struct NewConfiguracao {
    pub id: String,
    pub id_usuario: Option<String>,
    pub chave: String,
    pub valor: Option<String>,
    pub categoria: Option<String>,
    pub descricao: Option<String>,
    pub tipo_dado: Option<String>,
    pub eh_publica: bool,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}
