#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;
        use crate::schema::categorias::dsl::{categorias, id as categoria_id};
    use chrono::Utc;
    use diesel::prelude::*;

    #[test]
    fn test_insert_and_query_categoria() {
        use crate::models::usuario::NewUsuario;
                use crate::schema::usuarios::dsl::{usuarios, id as usuario_id};
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

        let nova = NewCategoria {
            id: ulid::Ulid::new().to_string(),
            id_usuario: Some(usuario_id_val.clone()),
            nome: "Categoria Teste".to_string(),
            tipo: "receita".to_string(),
            icone: Some("icon.png".to_string()),
            cor: Some("#fff".to_string()),
            criado_em: now,
            atualizado_em: now,
        };
        diesel::insert_into(categorias)
            .values(&nova)
            .execute(conn)
            .expect("Erro ao inserir categoria");
            let result = categorias
                .filter(categoria_id.eq(&nova.id))
            .first::<Categoria>(conn)
            .expect("Categoria não encontrada");
        assert_eq!(result.id, nova.id);
        assert_eq!(result.nome, "Categoria Teste");
        assert_eq!(result.tipo, "receita");

        // Limpa os registros criados
                diesel::delete(categorias.filter(categoria_id.eq(&nova.id))).execute(conn).ok();
                diesel::delete(usuarios.filter(usuario_id.eq(&usuario_id_val))).execute(conn).ok();
    }
}
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use ulid::Ulid;
use chrono::{NaiveDateTime};
use crate::models::Usuario;
use crate::schema::categorias;


#[derive(Debug, Clone, Queryable, Identifiable, Associations, Serialize, Deserialize)]
#[diesel(table_name = categorias)]
#[diesel(belongs_to(Usuario, foreign_key = id_usuario))]
pub struct Categoria {
    pub id: String,
    pub id_usuario: Option<String>,
    pub nome: String,
    pub tipo: String,
    pub icone: Option<String>,
    pub cor: Option<String>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = categorias)]
pub struct NewCategoria {
    pub id: String,
    pub id_usuario: Option<String>,
    pub nome: String,
    pub tipo: String,
    pub icone: Option<String>,
    pub cor: Option<String>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}

impl NewCategoria {
    pub fn new(nome: String, tipo: String) -> Self {
        let now = chrono::Utc::now().naive_utc();
        NewCategoria {
            id: Ulid::new().to_string(),
            id_usuario: None,
            nome,
            tipo,
            icone: None,
            cor: None,
            criado_em: now,
            atualizado_em: now,
        }
    }
}
