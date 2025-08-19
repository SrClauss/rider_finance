#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;
    use crate::models::{Meta, Transacao};
    use crate::schema::metas::dsl as metas_dsl;
    use crate::schema::transacoes::dsl as trans_dsl;
    use chrono::Utc;
    use diesel::prelude::*;

    use crate::models::meta::NewMeta;
    use crate::models::transacao::NewTransacao;
    #[test]
    fn test_buscar_metas_ativas_com_transacoes() {
        // Ambiente de teste
        std::env::set_var("ENVIRONMENT", "tests");
        let conn = &mut db::establish_connection();
        // Limpa tabelas principais
        diesel::delete(crate::schema::transacoes::dsl::transacoes).execute(conn).ok();
        diesel::delete(crate::schema::metas::dsl::metas).execute(conn).ok();
        diesel::delete(crate::schema::categorias::dsl::categorias).execute(conn).ok();
        diesel::delete(crate::schema::usuarios::dsl::usuarios).execute(conn).ok();

        let now = Utc::now().naive_utc();
        // Cria usuário fake
        let usuario_id = ulid::Ulid::new().to_string();
        let new_user = crate::models::usuario::NewUsuario {
            id: usuario_id.clone(),
            nome_usuario: "user_meta_test".to_string(),
            email: "meta@teste.com".to_string(),
            senha: "senha123".to_string(),
            nome_completo: "Meta Test".to_string(),
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
        diesel::insert_into(crate::schema::usuarios::dsl::usuarios)
            .values(&new_user)
            .on_conflict(crate::schema::usuarios::dsl::id)
            .do_nothing()
            .execute(conn)
            .ok();

        // Cria categoria fake
        let cat_id = ulid::Ulid::new().to_string();
        let new_cat = crate::models::categoria::NewCategoria {
            id: cat_id.clone(),
            id_usuario: Some(usuario_id.clone()),
            nome: "Categoria Teste".to_string(),
            tipo: "entrada".to_string(),
            icone: None,
            cor: None,
            eh_padrao: false,
            eh_ativa: true,
            criado_em: now,
            atualizado_em: now,
        };
        diesel::insert_into(crate::schema::categorias::dsl::categorias)
            .values(&new_cat)
            .on_conflict(crate::schema::categorias::dsl::id)
            .do_nothing()
            .execute(conn)
            .ok();

        // Cria meta ativa
        let meta_id = ulid::Ulid::new().to_string();
        let new_meta = NewMeta {
            id: meta_id.clone(),
            id_usuario: usuario_id.clone(),
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
            criado_em: now,
            atualizado_em: now,
            concluida_com: None,
        };
        diesel::insert_into(metas_dsl::metas)
            .values(&new_meta)
            .execute(conn)
            .ok();

        // Cria transação dentro do período da meta
        let trans_id = ulid::Ulid::new().to_string();
        let new_trans = NewTransacao {
            id: trans_id.clone(),
            id_usuario: usuario_id.clone(),
            id_categoria: cat_id.clone(),
            valor: 500,
            descricao: Some("Transação Teste".to_string()),
            tipo: "entrada".to_string(),
            data: now,
            origem: Some("app".to_string()),
            id_externo: None,
            plataforma: Some("Uber".to_string()),
            observacoes: Some("Teste".to_string()),
            tags: Some("tag1,tag2".to_string()),
            criado_em: now,
            atualizado_em: now,
        };
        diesel::insert_into(trans_dsl::transacoes)
            .values(&new_trans)
            .execute(conn)
            .ok();

        // Testa service
        let result = buscar_metas_ativas_com_transacoes(conn, &usuario_id).expect("Erro ao buscar");
        assert_eq!(result.metas.len(), 1);
        assert_eq!(result.transacoes.len(), 1);
        assert_eq!(result.transacoes[0].valor, 500);

        // Limpa tudo
        diesel::delete(trans_dsl::transacoes.filter(trans_dsl::id.eq(&trans_id))).execute(conn).ok();
        diesel::delete(metas_dsl::metas.filter(metas_dsl::id.eq(&meta_id))).execute(conn).ok();
        diesel::delete(crate::schema::categorias::dsl::categorias.filter(crate::schema::categorias::dsl::id.eq(&cat_id))).execute(conn).ok();
        diesel::delete(crate::schema::usuarios::dsl::usuarios.filter(crate::schema::usuarios::dsl::id.eq(&usuario_id))).execute(conn).ok();
    }
}
use crate::models::{Meta, Transacao};
use crate::schema::{metas, transacoes};
use diesel::pg::PgConnection;
use diesel::prelude::*;
use chrono::NaiveDateTime;
use serde::Serialize;

#[derive(Serialize)]
pub struct MetasComTransacoes {
    pub metas: Vec<Meta>,
    pub transacoes: Vec<Transacao>,
}

pub fn buscar_metas_ativas_com_transacoes(conn: &mut PgConnection, usuario_id: &str) -> Result<MetasComTransacoes, diesel::result::Error> {
    // Se não houver metas ativas, não retorna nenhuma transação
    if metas_ativas.is_empty() {
        return Ok(MetasComTransacoes {
            metas: vec![],
            transacoes: vec![],
        });
    }
    use crate::schema::metas::dsl as metas_dsl;
    use crate::schema::transacoes::dsl as trans_dsl;

    // Busca todas as metas ativas do usuário
    let metas_ativas: Vec<Meta> = metas_dsl::metas
        .filter(metas_dsl::id_usuario.eq(usuario_id))
        .filter(metas_dsl::eh_ativa.eq(true))
        .load::<Meta>(conn)?;

    // Descobre o maior intervalo de datas das metas ativas
    let (min_inicio, max_fim) = {
        let mut min: Option<NaiveDateTime> = None;
        let mut max: Option<NaiveDateTime> = None;
        for meta in &metas_ativas {
            if min.is_none() || meta.data_inicio < min.unwrap() {
                min = Some(meta.data_inicio);
            }
            if let Some(df) = meta.data_fim {
                if max.is_none() || df > max.unwrap() {
                    max = Some(df);
                }
            }
        }
        (min, max)
    };

    // Busca todas as transações do usuário que estejam no intervalo de qualquer meta ativa
    let mut query = trans_dsl::transacoes
        .filter(trans_dsl::id_usuario.eq(usuario_id))
        .into_boxed();
    if let Some(min_inicio) = min_inicio {
        query = query.filter(trans_dsl::data.ge(min_inicio));
    }
    if let Some(max_fim) = max_fim {
        query = query.filter(trans_dsl::data.le(max_fim));
    }
    let transacoes: Vec<Transacao> = query.order(trans_dsl::data.asc()).load::<Transacao>(conn)?;

    Ok(MetasComTransacoes {
        metas: metas_ativas,
        transacoes,
    })
}
