#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;
    use crate::schema::metas::dsl::{metas, id as meta_id};
    use crate::schema::usuarios::dsl::{id as usuario_id};
    use chrono::Utc;
    use diesel::prelude::*;

    #[test]
    fn test_insert_and_query_meta() {
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

        let nova = NewMeta {
            id: ulid::Ulid::new().to_string(),
            id_usuario: usuario_id_val.clone(),
            titulo: "Meta Teste".to_string(),
            descricao: Some("desc_teste".to_string()),
            tipo: "financeira".to_string(),
            categoria: "cat_teste".to_string(),
            valor_alvo: 1000,
            valor_atual: 100,
            unidade: Some("R$".to_string()),
            data_inicio: now,
            data_fim: None,
            eh_ativa: true,
            eh_concluida: false,
            concluida_em: None,
            lembrete_ativo: false,
            frequencia_lembrete: None,
            criado_em: now,
            atualizado_em: now,
        };
        diesel::insert_into(metas)
            .values(&nova)
            .execute(conn)
            .expect("Erro ao inserir meta");
        let result = metas
            .filter(meta_id.eq(&nova.id))
            .first::<Meta>(conn)
            .expect("Meta não encontrada");
        assert_eq!(result.id, nova.id);
        assert_eq!(result.titulo, "Meta Teste");
        assert_eq!(result.valor_alvo, 1000);

        // Limpa os registros criados
    diesel::delete(metas.filter(meta_id.eq(&nova.id))).execute(conn).ok();
    diesel::delete(usuarios.filter(usuario_id.eq(&usuario_id_val))).execute(conn).ok();
    }
}
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use chrono::{NaiveDateTime};
use crate::models::Usuario;
use crate::schema::metas;

#[derive(Debug, Clone, Queryable, Identifiable, Associations, Serialize, Deserialize)]
#[diesel(table_name = metas)]
#[diesel(belongs_to(Usuario, foreign_key = id_usuario))]
pub struct Meta {
    pub id: String,
    pub id_usuario: String,
    pub titulo: String,
    pub descricao: Option<String>,
    pub tipo: String,
    pub categoria: String,
    pub valor_alvo: i32,
    pub valor_atual: i32,
    pub unidade: Option<String>,
    pub data_inicio: NaiveDateTime,
    pub data_fim: Option<NaiveDateTime>,
    pub eh_ativa: bool,
    pub eh_concluida: bool,
    pub concluida_em: Option<NaiveDateTime>,
    pub lembrete_ativo: bool,
    pub frequencia_lembrete: Option<String>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}

#[derive(Debug, Insertable)]
#[diesel(table_name = metas)]
pub struct NewMeta {
    pub id: String,
    pub id_usuario: String,
    pub titulo: String,
    pub descricao: Option<String>,
    pub tipo: String,
    pub categoria: String,
    pub valor_alvo: i32,
    pub valor_atual: i32,
    pub unidade: Option<String>,
    pub data_inicio: NaiveDateTime,
    pub data_fim: Option<NaiveDateTime>,
    pub eh_ativa: bool,
    pub eh_concluida: bool,
    pub concluida_em: Option<NaiveDateTime>,
    pub lembrete_ativo: bool,
    pub frequencia_lembrete: Option<String>,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}
