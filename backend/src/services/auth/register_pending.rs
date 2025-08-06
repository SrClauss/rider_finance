
use crate::models::NewUsuario;
use crate::services::auth::email_mock;
use ulid::Ulid;
use chrono::Utc;

pub fn register_pending_user(email: &str) -> Result<(), String> {
    // Cria usuário com senha vazia e status pendente
    let usuario = NewUsuario {
        id: Ulid::new().to_string(),
        nome_usuario: email.to_string(),
        email: email.to_string(),
        senha: "".to_string(),
        nome_completo: None,
        telefone: None,
        veiculo: None,
        data_inicio_atividade: None,
        eh_pago: false,
        id_pagamento: None,
        metodo_pagamento: None,
        status_pagamento: "pendente".to_string(),
        tipo_assinatura: "mensal".to_string(),
        trial_termina_em: None,
        criado_em: Utc::now().naive_utc(),
        atualizado_em: Utc::now().naive_utc(),
    };
    // TODO: inserir usuario no banco de dados
    email_mock::send_reset_link(email);
    Ok(())
}
