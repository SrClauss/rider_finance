    pub fn create_fake_user() -> String {
        use crate::models::usuario::NewUsuario;
        use crate::schema::usuarios::dsl::*;
        let conn = &mut establish_connection();
        let now = chrono::Utc::now().naive_utc();
        let usuario_id = "user_relatorio_test".to_string();
        // Remove usuário se já existir
        diesel::delete(usuarios.filter(id.eq(&usuario_id))).execute(conn).ok();
        let new_user = NewUsuario {
            id: usuario_id.clone(),
            nome_usuario: "user_relatorio_test".to_string(),
            email: "relatorio@teste.com".to_string(),
            senha: "senha123".to_string(),
            nome_completo: "Relatorio Teste".to_string(),
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
        // Garante persistência
        let _ = usuarios.filter(id.eq(&usuario_id)).first::<crate::models::usuario::Usuario>(conn).expect("Usuário não persistido");
        usuario_id
    }

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::establish_connection;
    use diesel::prelude::*;
    use crate::schema::{transacoes, sessoes_trabalho, metas};
    use axum::extract::Query;

    fn clean_db() {
    std::env::set_var("ENVIRONMENT", "tests");
    let conn = &mut establish_connection();
    diesel::delete(transacoes::dsl::transacoes).execute(conn).ok();
    diesel::delete(sessoes_trabalho::dsl::sessoes_trabalho).execute(conn).ok();
    diesel::delete(metas::dsl::metas).execute(conn).ok();
    diesel::delete(crate::schema::categorias::dsl::categorias).execute(conn).ok();
    }

    #[tokio::test]
    
    async fn test_relatorio_stats_handler() {
        use axum_extra::extract::cookie::{Cookie, CookieJar};
        use jsonwebtoken::{encode, EncodingKey, Header};
        use crate::services::transacao::Claims;
        clean_db(); // Limpa tudo antes do teste
        let conn = &mut establish_connection();
        // Gera ID único para usuário e categorias
        let id_usuario = ulid::Ulid::new().to_string();
        let cat1_id = ulid::Ulid::new().to_string();
        let cat2_id = ulid::Ulid::new().to_string();
        let now = chrono::Utc::now().naive_utc();
        // Cria usuário
        let new_user = crate::models::usuario::NewUsuario {
            id: id_usuario.clone(),
            nome_usuario: format!("user_relatorio_test_{}", id_usuario),
            email: format!("relatorio_{}@teste.com", id_usuario),
            senha: "senha123".to_string(),
            nome_completo: "Relatorio Teste".to_string(),
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
        diesel::insert_into(crate::schema::usuarios::table)
            .values(&new_user)
            .execute(conn)
            .expect("Erro ao inserir usuário");
        // Assert usuário criado
        let usuario_existe = crate::schema::usuarios::dsl::usuarios
            .filter(crate::schema::usuarios::dsl::id.eq(&id_usuario))
            .first::<crate::models::usuario::Usuario>(conn)
            .is_ok();
        assert!(usuario_existe, "Usuário não foi criado corretamente");

        // Cria categorias cat1 e cat2
        diesel::insert_into(crate::schema::categorias::table)
            .values(&crate::models::NewCategoria {
                id: cat1_id.clone(),
                id_usuario: Some(id_usuario.clone()),
                nome: "Categoria 1".to_string(),
                tipo: "entrada".to_string(),
                icone: None,
                cor: None,
                eh_padrao: false,
                eh_ativa: true,
                criado_em: now,
                atualizado_em: now,
            })
            .execute(conn).unwrap();
        diesel::insert_into(crate::schema::categorias::table)
            .values(&crate::models::NewCategoria {
                id: cat2_id.clone(),
                id_usuario: Some(id_usuario.clone()),
                nome: "Categoria 2".to_string(),
                tipo: "saida".to_string(),
                icone: None,
                cor: None,
                eh_padrao: false,
                eh_ativa: true,
                criado_em: now,
                atualizado_em: now,
            })
            .execute(conn).unwrap();
        // Assert categorias criadas
        let cat1_existe = crate::schema::categorias::dsl::categorias
            .filter(crate::schema::categorias::dsl::id.eq(&cat1_id))
            .first::<crate::models::categoria::Categoria>(conn)
            .is_ok();
        let cat2_existe = crate::schema::categorias::dsl::categorias
            .filter(crate::schema::categorias::dsl::id.eq(&cat2_id))
            .first::<crate::models::categoria::Categoria>(conn)
            .is_ok();
        assert!(cat1_existe && cat2_existe, "Categorias não foram criadas corretamente");

        // Cria transação entrada
        diesel::insert_into(transacoes::table)
            .values(&crate::models::NewTransacao {
                id: ulid::Ulid::new().to_string(),
                id_usuario: id_usuario.clone(),
                id_categoria: cat1_id.clone(),
                valor: 200,
                tipo: "entrada".to_string(),
                descricao: Some("Teste entrada".to_string()),
                data: now,
                origem: None,
                id_externo: None,
                plataforma: None,
                observacoes: None,
                tags: None,
                criado_em: now,
                atualizado_em: now,
            })
            .execute(conn).unwrap();
        // Cria transação saída
        diesel::insert_into(transacoes::table)
            .values(&crate::models::NewTransacao {
                id: ulid::Ulid::new().to_string(),
                id_usuario: id_usuario.clone(),
                id_categoria: cat2_id.clone(),
                valor: 50,
                tipo: "saida".to_string(),
                descricao: Some("Teste saida".to_string()),
                data: now,
                origem: None,
                id_externo: None,
                plataforma: None,
                observacoes: None,
                tags: None,
                criado_em: now,
                atualizado_em: now,
            })
            .execute(conn).unwrap();
        // Assert transações criadas
        let transacoes_count: i64 = crate::schema::transacoes::dsl::transacoes
            .filter(crate::schema::transacoes::dsl::id_usuario.eq(&id_usuario))
            .count()
            .get_result(conn)
            .unwrap();
        assert_eq!(transacoes_count, 2, "Transações não foram criadas corretamente");

        // Cria sessão de trabalho
        diesel::insert_into(sessoes_trabalho::table)
            .values(&crate::models::sessao_trabalho::NewSessaoTrabalho {
                id: ulid::Ulid::new().to_string(),
                id_usuario: id_usuario.clone(),
                inicio: now,
                fim: None,
                total_minutos: Some(240),
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
            })
            .execute(conn).unwrap();
        // Assert sessão criada
        let sessoes_count: i64 = crate::schema::sessoes_trabalho::dsl::sessoes_trabalho
            .filter(crate::schema::sessoes_trabalho::dsl::id_usuario.eq(&id_usuario))
            .count()
            .get_result(conn)
            .unwrap();
        assert_eq!(sessoes_count, 1, "Sessão de trabalho não foi criada corretamente");

        // Cria meta
        diesel::insert_into(metas::table)
            .values(&crate::models::meta::NewMeta {
                id: ulid::Ulid::new().to_string(),
                id_usuario: id_usuario.clone(),
                titulo: "Meta Teste".to_string(),
                descricao: Some("desc".to_string()),
                tipo: "financeira".to_string(),
                categoria: "poupança".to_string(),
                valor_alvo: 1000,
                valor_atual: 100,
                unidade: Some("R$".to_string()),
                data_inicio: chrono::NaiveDate::from_ymd_opt(2025,8,14).unwrap().and_hms_opt(0,0,0).unwrap(),
                data_fim: None,
                eh_ativa: true,
                eh_concluida: false,
                concluida_em: None,
                concluida_com: None,
                criado_em: now,
                atualizado_em: now,
            })
            .execute(conn).unwrap();
        // Assert meta criada
        let metas_count: i64 = crate::schema::metas::dsl::metas
            .filter(crate::schema::metas::dsl::id_usuario.eq(&id_usuario))
            .count()
            .get_result(conn)
            .unwrap();
        assert_eq!(metas_count, 1, "Meta não foi criada corretamente");

        // Gera JWT válido para o usuário seed
        let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
        let claims = Claims { sub: id_usuario.clone(), email: format!("relatorio_{}@teste.com", id_usuario), exp: 2000000000 };
        let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_ref())).unwrap();
        let jar = CookieJar::new().add(Cookie::new("auth_token", token));
        // Testa handler
        let filtro = RelatorioFiltro {
            data_inicio: None,
            data_fim: None,
            tipo: None,
            categoria: None,
        };
        let Json(resp) = relatorio_stats_handler(jar, Query(filtro)).await;
        assert_eq!(resp.ganhos, 200.0);
        assert_eq!(resp.gastos, 50.0);
        assert_eq!(resp.lucro, 150.0);
        assert_eq!(resp.corridas, 5);
        assert_eq!(resp.horas, 4.0);
        assert_eq!(resp.metas.len(), 1);
    }
    }

use axum::{Json, extract::Query};
use serde::{Serialize, Deserialize};
use chrono::{NaiveDateTime};
use diesel::prelude::*;
use crate::db::{self, establish_connection};
use crate::schema::transacoes::dsl as transacao_dsl;
use crate::schema::sessoes_trabalho::dsl as sessao_dsl;
use crate::schema::metas::dsl as meta_dsl;

use axum_extra::extract::cookie::CookieJar;
use jsonwebtoken::{decode, DecodingKey, Validation};
use crate::services::transacao::Claims;

#[derive(Deserialize)]
pub struct RelatorioFiltro {
    pub data_inicio: Option<NaiveDateTime>,
    pub data_fim: Option<NaiveDateTime>,
    pub tipo: Option<String>, // receita, despesa, etc
    pub categoria: Option<String>,
}

#[derive(Serialize)]
pub struct RelatorioStats {
    pub ganhos: f64,
    pub gastos: f64,
    pub lucro: f64,
    pub corridas: u32,
    pub horas: f64,
    pub metas: Vec<f64>,
}

pub async fn relatorio_stats_handler(jar: CookieJar, Query(filtro): Query<RelatorioFiltro>) -> Json<RelatorioStats> {
    let conn = &mut db::establish_connection();
    let token = jar.get("auth_token").map(|c| c.value().to_string()).unwrap_or_default();
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let claims = decode::<Claims>(token.as_str(), &DecodingKey::from_secret(secret.as_ref()), &Validation::default())
        .map(|token_data| token_data.claims)
        .unwrap_or_else(|_| Claims { sub: "".to_string(), email: "".to_string(), exp: 0 });
    let user_id = claims.sub;
    // Filtros base
    let mut ganhos_query = transacao_dsl::transacoes.filter(transacao_dsl::id_usuario.eq(&user_id)).filter(transacao_dsl::tipo.eq("entrada")).into_boxed();
    let mut gastos_query = transacao_dsl::transacoes.filter(transacao_dsl::id_usuario.eq(&user_id)).filter(transacao_dsl::tipo.eq("saida")).into_boxed();
    if let Some(ref tipo) = filtro.tipo {
        ganhos_query = ganhos_query.filter(transacao_dsl::tipo.eq(tipo));
        gastos_query = gastos_query.filter(transacao_dsl::tipo.eq(tipo));
    }
    if let Some(ref categoria) = filtro.categoria {
        ganhos_query = ganhos_query.filter(transacao_dsl::id_categoria.eq(categoria));
        gastos_query = gastos_query.filter(transacao_dsl::id_categoria.eq(categoria));
    }
    if let Some(data_inicio) = filtro.data_inicio {
        ganhos_query = ganhos_query.filter(transacao_dsl::data.ge(data_inicio));
        gastos_query = gastos_query.filter(transacao_dsl::data.ge(data_inicio));
    }
    if let Some(data_fim) = filtro.data_fim {
        ganhos_query = ganhos_query.filter(transacao_dsl::data.le(data_fim));
        gastos_query = gastos_query.filter(transacao_dsl::data.le(data_fim));
    }
    let ganhos: f64 = ganhos_query.select(diesel::dsl::sum(transacao_dsl::valor)).first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as f64;
    let gastos: f64 = gastos_query.select(diesel::dsl::sum(transacao_dsl::valor)).first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as f64;
    let lucro = ganhos - gastos;
    let corridas: u32 = sessao_dsl::sessoes_trabalho.filter(sessao_dsl::id_usuario.eq(&user_id)).select(diesel::dsl::sum(sessao_dsl::total_corridas)).first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0) as u32;
    let minutos: i64 = sessao_dsl::sessoes_trabalho.filter(sessao_dsl::id_usuario.eq(&user_id)).select(diesel::dsl::sum(sessao_dsl::total_minutos)).first::<Option<i64>>(conn).unwrap_or(Some(0)).unwrap_or(0);
    let horas = minutos as f64 / 60.0;
    let metas: Vec<f64> = meta_dsl::metas.filter(meta_dsl::id_usuario.eq(&user_id)).filter(meta_dsl::eh_ativa.eq(true)).select(meta_dsl::valor_alvo).load::<i32>(conn).unwrap_or_default().into_iter().map(|v| v as f64).collect();
    Json(RelatorioStats { ganhos, gastos, lucro, corridas, horas, metas })
}

// Interseção e união dos dados de dashboard e relatório podem ser feitas no frontend, mas aqui o endpoint retorna tudo filtrado

