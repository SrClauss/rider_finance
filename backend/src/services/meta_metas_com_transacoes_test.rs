#[cfg(test)]
mod tests {
    use super::super::meta_metas_com_transacoes::buscar_metas_ativas_com_transacoes;
    use crate::db;
    use crate::models::{Meta, Transacao};
    use crate::schema::metas::dsl as metas_dsl;
    use crate::schema::transacoes::dsl as trans_dsl;
    use chrono::Utc;
    use diesel::prelude::*;

    #[test]
    fn test_buscar_metas_ativas_com_transacoes() {
        let conn = &mut db::establish_connection();
        let now = Utc::now().naive_utc();
        let usuario_id = ulid::Ulid::new().to_string();

        // Cria meta ativa
        let meta = Meta {
            id: ulid::Ulid::new().to_string(),
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
            .values(&meta)
            .execute(conn)
            .expect("Erro ao inserir meta");

        // Cria transação dentro do período da meta
        let trans = Transacao {
            id: ulid::Ulid::new().to_string(),
            id_usuario: usuario_id.clone(),
            id_categoria: ulid::Ulid::new().to_string(),
            valor: 500,
            descricao: Some("Transação Teste".to_string()),
            tipo: "receita".to_string(),
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
            .values(&trans)
            .execute(conn)
            .expect("Erro ao inserir transacao");

        // Testa service
        let result = buscar_metas_ativas_com_transacoes(conn, &usuario_id).expect("Erro ao buscar");
        assert_eq!(result.metas.len(), 1);
        assert_eq!(result.transacoes.len(), 1);
        assert_eq!(result.transacoes[0].valor, 500);

        // Limpa
        diesel::delete(trans_dsl::transacoes.filter(trans_dsl::id.eq(&trans.id))).execute(conn).ok();
        diesel::delete(metas_dsl::metas.filter(metas_dsl::id.eq(&meta.id))).execute(conn).ok();
    }
}
