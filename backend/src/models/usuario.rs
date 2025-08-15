#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;
    use crate::schema::usuarios::dsl::*;
    use chrono::Utc;
    use diesel::prelude::*;

    #[test]
    fn test_insert_and_query_usuario() {
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
        let result = usuarios
            .filter(id.eq(&usuario_id))
            .first::<Usuario>(conn)
            .expect("Usuário não encontrado");
        assert_eq!(result.id, usuario_id);
        assert_eq!(result.nome_usuario, "user_test");
        assert_eq!(result.email, "teste@teste.com");

        // Limpa o registro criado
        diesel::delete(usuarios.filter(id.eq(&usuario_id))).execute(conn).ok();
    }
}
use crate::schema::usuarios;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use ulid::Ulid;
use chrono::NaiveDateTime;

#[derive(Debug, Clone, Queryable, Identifiable, Serialize, Deserialize)]
#[diesel(table_name = usuarios)]
pub struct Usuario {
    pub id: String,
    pub nome_usuario: String,
    pub email: String,
    pub senha: String,
    pub nome_completo: String,
    pub telefone: String,
    pub veiculo: String,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
    pub ultima_tentativa_redefinicao: NaiveDateTime,
    pub address: String,
    pub address_number: String,
    pub complement: String,
    pub postal_code: String,
    pub province: String,
    pub city: String,
    pub cpfcnpj: String,
}

#[derive(Debug, Clone, Insertable, Serialize, Deserialize)]
#[diesel(table_name = usuarios)]
pub struct NewUsuario {
    pub id: String,
    pub nome_usuario: String,
    pub email: String,
    pub senha: String,
    pub nome_completo: String,
    pub telefone: String,
    pub veiculo: String,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
    pub ultima_tentativa_redefinicao: NaiveDateTime,
    pub address: String,
    pub address_number: String,
    pub complement: String,
    pub postal_code: String,
    pub province: String,
    pub city: String,
    pub cpfcnpj: String,
}

#[derive(Debug, Clone, Insertable)]
#[diesel(table_name = usuarios)]
pub struct NewUsuarioSemSenha {
    pub id: String,
    pub nome_usuario: String,
    pub email: String,
    pub senha: Option<String>,
    pub nome_completo: Option<String>,
    pub telefone: Option<String>,
    pub veiculo: Option<String>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
    pub address: String,
    pub address_number: String,
    pub complement: String,
    pub postal_code: String,
    pub province: String,
    pub city: String,
}

impl NewUsuario {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        id: Option<String>,
        nome_usuario: String,
        email: String,
        senha: String,
        nome_completo: String,
        telefone: String,
        veiculo: String,
        criado_em: Option<NaiveDateTime>,
        atualizado_em: Option<NaiveDateTime>,
        ultima_tentativa_redefinicao: Option<NaiveDateTime>,
        address: String,
        address_number: String,
        complement: String,
        postal_code: String,
        province: String,
        city: String,
        cpfcnpj: String,
    ) -> Self {
        let now = chrono::Utc::now().naive_utc();
        let senha_hash = bcrypt::hash(senha, bcrypt::DEFAULT_COST).expect("Erro ao hashear senha");
        NewUsuario {
            id: id.unwrap_or_else(|| Ulid::new().to_string()),
            nome_usuario,
            email,
            senha: senha_hash,
            nome_completo,
            telefone,
            veiculo,
            criado_em: criado_em.unwrap_or(now),
            atualizado_em: atualizado_em.unwrap_or(now),
            ultima_tentativa_redefinicao: ultima_tentativa_redefinicao.unwrap_or(now),
            address,
            address_number,
            complement,
            postal_code,
            province,
            city,
            cpfcnpj,
        }
    }
}

impl NewUsuarioSemSenha {
    pub fn new(nome_usuario: String, email: String) -> Self {
        let now = chrono::Utc::now().naive_utc();
        NewUsuarioSemSenha {
            id: Ulid::new().to_string(),
            nome_usuario,
            email,
            senha: None,
            nome_completo: None,
            telefone: None,
            veiculo: None,
            criado_em: now,
            atualizado_em: now,
            address: "".to_string(),
            address_number: "".to_string(),
            complement: "".to_string(),
            postal_code: "".to_string(),
            province: "".to_string(),
            city: "".to_string(),
        }
    }
}
