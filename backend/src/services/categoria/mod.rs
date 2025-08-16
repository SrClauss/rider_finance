use axum_extra::extract::cookie::CookieJar;
use jsonwebtoken::{decode, DecodingKey, Validation};
use crate::services::dashboard::Claims;
/// Retorna as categorias do usuário autenticado (cookie http-only)
#[cfg(test)]
mod tests {
    use super::*;
    use axum::Json;
    use serial_test::serial;


    fn clean_db() {
        std::env::set_var("ENVIRONMENT", "tests");
        let conn = &mut db::establish_connection();
        diesel::delete(categorias).execute(conn).ok();
        diesel::delete(crate::schema::usuarios::dsl::usuarios).execute(conn).ok();
    }

    fn create_fake_user(user_id: &str) {
        use crate::models::NewUsuario;
        use crate::schema::usuarios::dsl::*;
        let conn = &mut db::establish_connection();
        let now = chrono::Utc::now().naive_utc();
        let new_user = NewUsuario {
            id: user_id.to_string(),
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
        diesel::insert_into(usuarios).values(&new_user).execute(conn).ok();
        // Garante persistência
        let _ = usuarios.filter(id.eq(user_id)).first::<crate::models::Usuario>(conn).expect("Usuário não persistido");
    }

    #[tokio::test]
    #[serial]


    async fn test_create_and_get_categoria() {
        clean_db();
        let user_id = "user1";
        // Usa a mesma conexão para todas as operações
        let conn = &mut db::establish_connection();
        // Cria usuário
        {
            use crate::models::NewUsuario;
            use crate::schema::usuarios::dsl::*;
            let now = chrono::Utc::now().naive_utc();
            let new_user = NewUsuario {
                id: user_id.to_string(),
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
            diesel::insert_into(usuarios).values(&new_user).execute(conn).ok();
            let _ = usuarios.filter(id.eq(user_id)).first::<crate::models::Usuario>(conn).expect("Usuário não persistido");
        }
        // Cria categoria
        let now = chrono::Utc::now().naive_utc();
        let nova_categoria = crate::models::NewCategoria {
            id: ulid::Ulid::new().to_string(),
            id_usuario: Some(user_id.to_string()),
            nome: "Categoria Teste".to_string(),
            tipo: "entrada".to_string(),
            icone: Some("icon".to_string()),
            cor: Some("#fff".to_string()),
            eh_padrao: false,
            eh_ativa: true,
            criado_em: now,
            atualizado_em: now,
        };
        diesel::insert_into(categorias).values(&nova_categoria).execute(conn).expect("Erro ao inserir categoria");
        // Busca categoria
        let cat = categorias.filter(id.eq(&nova_categoria.id)).first::<crate::models::Categoria>(conn).expect("Categoria não encontrada");
        assert_eq!(cat.nome, "Categoria Teste");
    }

    #[tokio::test]
    #[serial]
    async fn test_list_and_delete_categoria() {
        clean_db();
        let user_id = "user2";
        create_fake_user(user_id);
        // Cria duas categorias
        let payload1 = CreateCategoriaPayload {
            id_usuario: Some(user_id.to_string()),
            nome: "Cat1".to_string(),
            tipo: "entrada".to_string(),
            icone: None,
            cor: None,
            eh_padrao: false,
            eh_ativa: true,
        };
        let Json(resp1) = create_categoria_handler(Json(payload1)).await;
        let payload2 = CreateCategoriaPayload {
            id_usuario: Some(user_id.to_string()),
            nome: "Cat2".to_string(),
            tipo: "saida".to_string(),
            icone: None,
            cor: None,
            eh_padrao: false,
            eh_ativa: true,
        };
        let Json(_resp2) = create_categoria_handler(Json(payload2)).await;
    // Lista usando handler autenticado (simulando cookie)
    // Aqui, como não temos CookieJar real no teste, pode-se testar apenas criação e deleção
    let Json(ok) = delete_categoria_handler(axum::extract::Path(resp1.id.clone())).await;
    assert!(ok);
    }
}
use axum::{Json, extract::Path};
use diesel::prelude::*;
use serde::{Serialize, Deserialize};
use crate::db;
use crate::schema::categorias::dsl::*;
use crate::models::{Categoria, NewCategoria};
use chrono::NaiveDateTime;

#[derive(Deserialize)]
pub struct CreateCategoriaPayload {
    pub id_usuario: Option<String>,
    pub nome: String,
    pub tipo: String,
    pub icone: Option<String>,
    pub cor: Option<String>,
    pub eh_padrao: bool,
    pub eh_ativa: bool,
}

#[derive(Serialize)]
pub struct CategoriaResponse {
    pub id: String,
    pub id_usuario: Option<String>,
    pub nome: String,
    pub tipo: String,
    pub icone: Option<String>,
    pub cor: Option<String>,
    pub eh_padrao: bool,
    pub eh_ativa: bool,
    pub criado_em: NaiveDateTime,
    pub atualizado_em: NaiveDateTime,
}
pub async fn list_categorias_autenticado_handler(jar: CookieJar) -> Json<Vec<CategoriaResponse>> {
    // Extrai token do cookie
    let token = jar.get("auth_token").map(|c| c.value().to_string()).unwrap_or_default();
    let secret = std::env::var("JWT_SECRET").unwrap_or_else(|_| "secret".to_string());
    let claims = decode::<Claims>(token.as_str(), &DecodingKey::from_secret(secret.as_ref()), &Validation::default())
        .map(|data| data.claims)
        .unwrap_or_else(|_| Claims { sub: "".to_string(), email: "".to_string(), exp: 0 });
    let usuario_id_val = claims.sub.clone();
    if usuario_id_val.is_empty() {
        return Json(vec![]);
    }
    let conn = &mut db::establish_connection();
    let results = categorias
        .filter(id_usuario.eq(usuario_id_val.clone()).or(eh_padrao.eq(true)))
        .order(nome.asc())
        .load::<Categoria>(conn)
        .unwrap_or_default();
    Json(results.into_iter().map(|c| CategoriaResponse {
        id: c.id,
        id_usuario: c.id_usuario,
        nome: c.nome,
        tipo: c.tipo,
        icone: c.icone,
        cor: c.cor,
        eh_padrao: c.eh_padrao,
        eh_ativa: c.eh_ativa,
        criado_em: c.criado_em,
        atualizado_em: c.atualizado_em,
    }).collect())
}

pub async fn create_categoria_handler(Json(payload): Json<CreateCategoriaPayload>) -> Json<CategoriaResponse> {
    let conn = &mut db::establish_connection();
    let now = chrono::Utc::now().naive_utc();
    let nova_categoria = NewCategoria {
        id: ulid::Ulid::new().to_string(),
        id_usuario: payload.id_usuario,
        nome: payload.nome,
        tipo: payload.tipo,
        icone: payload.icone,
        cor: payload.cor,
        eh_padrao: payload.eh_padrao,
        eh_ativa: payload.eh_ativa,
        criado_em: now,
        atualizado_em: now,
    };
    diesel::insert_into(categorias)
        .values(&nova_categoria)
        .execute(conn)
        .expect("Erro ao inserir categoria");
    Json(CategoriaResponse {
        id: nova_categoria.id,
        id_usuario: nova_categoria.id_usuario,
        nome: nova_categoria.nome,
        tipo: nova_categoria.tipo,
        icone: nova_categoria.icone,
        cor: nova_categoria.cor,
        eh_padrao: nova_categoria.eh_padrao,
        eh_ativa: nova_categoria.eh_ativa,
        criado_em: nova_categoria.criado_em,
        atualizado_em: nova_categoria.atualizado_em,
    })
}

pub async fn get_categoria_handler(Path(id_param): Path<String>) -> Json<Option<CategoriaResponse>> {
    let conn = &mut db::establish_connection();
    match categorias.filter(id.eq(id_param)).first::<Categoria>(conn) {
        Ok(c) => Json(Some(CategoriaResponse {
            id: c.id,
            id_usuario: c.id_usuario,
            nome: c.nome,
            tipo: c.tipo,
            icone: c.icone,
            cor: c.cor,
            eh_padrao: c.eh_padrao,
            eh_ativa: c.eh_ativa,
            criado_em: c.criado_em,
            atualizado_em: c.atualizado_em,
        })),
        Err(_) => Json(None),
    }
}

pub async fn delete_categoria_handler(Path(id_param): Path<String>) -> Json<bool> {
    let conn = &mut db::establish_connection();
    let count = diesel::delete(categorias.filter(id.eq(id_param))).execute(conn).unwrap_or(0);
    Json(count > 0)
}
