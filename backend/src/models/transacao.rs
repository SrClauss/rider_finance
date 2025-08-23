#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;
    use crate::schema::transacoes::dsl::{transacoes, id as transacao_id};
    use chrono::Utc;
    use diesel::prelude::*;

    #[test]
    fn test_insert_and_query_transacao() {
        std::env::set_var("ENVIRONMENT", "tests");
        use crate::models::usuario::NewUsuario;
        use crate::models::categoria::NewCategoria;
    use crate::schema::usuarios::dsl::{usuarios, id as usuario_id};
    use crate::schema::categorias::dsl::{categorias, id as categoria_id};
        let conn = &mut db::establish_connection();
        let now = Utc::now().naive_utc();
        let usuario_id_val = ulid::Ulid::new().to_string();
        let categoria_id_val = ulid::Ulid::new().to_string();
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
        let new_cat = NewCategoria {
            id: categoria_id_val.clone(),
            id_usuario: Some(usuario_id_val.clone()),
            nome: "Categoria Teste".to_string(),
            tipo: "receita".to_string(),
            icone: Some("icon.png".to_string()),
            cor: Some("#fff".to_string()),
            eh_padrao: false,
            eh_ativa: true,
            criado_em: now,
            atualizado_em: now,
        };
        diesel::insert_into(categorias)
            .values(&new_cat)
            .execute(conn)
            .expect("Erro ao inserir categoria");

        let nova = NewTransacao {
            id: ulid::Ulid::new().to_string(),
            id_usuario: usuario_id_val.clone(),
            id_categoria: categoria_id_val.clone(),
            valor: 1234,
            descricao: Some("desc_teste".to_string()),
            tipo: "receita".to_string(),
            data: now,
            criado_em: now,
            atualizado_em: now,
        };
        diesel::insert_into(transacoes)
            .values(&nova)
            .execute(conn)
            .expect("Erro ao inserir transacao");
            let result = transacoes
                .filter(transacao_id.eq(&nova.id))
                .first::<Transacao>(conn)
                .expect("Transacao não encontrada");
            assert_eq!(result.id, nova.id);
            assert_eq!(result.valor, 1234);
            assert_eq!(result.tipo, "receita");

        // Limpa os registros criados
            diesel::delete(transacoes.filter(transacao_id.eq(&nova.id))).execute(conn).ok();
            diesel::delete(categorias.filter(categoria_id.eq(&categoria_id_val))).execute(conn).ok();
            diesel::delete(usuarios.filter(usuario_id.eq(&usuario_id_val))).execute(conn).ok();
    }
}
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use ulid::Ulid;
use chrono::{NaiveDateTime};
use crate::schema::transacoes;
use crate::models::{Usuario, Categoria};


#[derive(Debug, Clone, Queryable, Identifiable, Associations, Serialize, Deserialize)]
#[diesel(table_name = transacoes)]
#[diesel(belongs_to(Usuario, foreign_key = id_usuario))]
#[diesel(belongs_to(Categoria, foreign_key = id_categoria))]
pub struct Transacao {
    pub id: String,
    pub id_usuario: String,
    pub id_categoria: String,
    pub valor: i32,
    pub descricao: Option<String>,
    pub tipo: String,
    pub data: NaiveDateTime,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = transacoes)]
pub struct NewTransacao {
    pub id: String,
    pub id_usuario: String,
    pub id_categoria: String,
    pub valor: i32,
    pub descricao: Option<String>,
    pub tipo: String,
    pub data: NaiveDateTime,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}

impl NewTransacao {
    pub fn new(id_usuario: String, id_categoria: String, valor: i32, tipo: String) -> Self {
        let now = chrono::Utc::now().naive_utc();
        NewTransacao {
            id: Ulid::new().to_string(),
            id_usuario,
            id_categoria,
            valor,
            descricao: None,
            tipo,
            data: now,
            criado_em: now,
            atualizado_em: now,
        }
    }
}
