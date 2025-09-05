use crate::models::usuario::NewUsuario;
use crate::schema::usuarios::dsl::*;
use diesel::prelude::*;
use chrono::Utc;
use crate::db::establish_connection;

/// Cria um usuário fake para testes e retorna o id gerado.
pub fn create_fake_user_with(
    usuario_id_: &str,
    nome_usuario_: &str,
    nome_completo_: &str,
    email_: &str,
    senha_: &str,
) -> String {
    // Garante que ENVIRONMENT=tests para este helper
    std::env::set_var("ENVIRONMENT", "tests");
    let conn = &mut establish_connection();
    let now = Utc::now().naive_utc();
    // Remove usuário se já existir
    diesel::delete(usuarios.filter(id.eq(usuario_id_))).execute(conn).ok();
    let new_user = NewUsuario {
        id: usuario_id_.to_string(),
        nome_usuario: nome_usuario_.to_string(),
        email: email_.to_string(),
        senha: senha_.to_string(),
        nome_completo: nome_completo_.to_string(),
        telefone: "11999999999".to_string(),
        veiculo: "Carro".to_string(),
    blocked: false,
    blocked_date: None,
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
    usuario_id_.to_string()
}

/// Cria um usuário fake padrão para testes e retorna o id gerado.
pub fn create_fake_user_default() -> String {
    create_fake_user_with(
        "user_test_id",
        "Teste",
        "Teste da silva",
        "teste@teste.com",
        "teste123",
    )
}
