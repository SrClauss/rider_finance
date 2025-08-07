use diesel::prelude::*;
use crate::models::Usuario;
use crate::db;
use bcrypt::verify;

/// Serviço de login recebendo struct Usuario já carregada do banco
pub fn login(usuario: &Usuario, senha: &str) -> Result<(), String> {
    if verify(senha, &usuario.senha).map_err(|_| "Erro ao verificar senha".to_string())? {
        Ok(())
    } else {
        Err("Senha incorreta".to_string())
    }
}
