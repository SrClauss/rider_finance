// @generated automatically by Diesel CLI.

diesel::table! {
    assinaturas (id) {
        id -> Varchar,
        id_usuario -> Varchar,
        tipo_plano -> Varchar,
        status -> Varchar,
        asaas_customer_id -> Varchar,
        asaas_subscription_id -> Nullable<Varchar>,
        periodo_inicio -> Timestamp,
        periodo_fim -> Timestamp,
        cancelada_em -> Nullable<Timestamp>,
        criado_em -> Timestamp,
        atualizado_em -> Timestamp,
    }
}

diesel::table! {
    categorias (id) {
        id -> Varchar,
        id_usuario -> Nullable<Varchar>,
        nome -> Varchar,
        tipo -> Varchar,
        icone -> Nullable<Varchar>,
        cor -> Nullable<Varchar>,
        eh_padrao -> Bool,
        eh_ativa -> Bool,
        criado_em -> Timestamp,
        atualizado_em -> Timestamp,
    }
}

diesel::table! {
    configuracoes (id) {
        id -> Varchar,
        id_usuario -> Nullable<Varchar>,
        chave -> Varchar,
        valor -> Nullable<Varchar>,
        categoria -> Nullable<Varchar>,
        descricao -> Nullable<Varchar>,
        tipo_dado -> Nullable<Varchar>,
        eh_publica -> Bool,
        criado_em -> Timestamp,
        atualizado_em -> Timestamp,
    }
}

diesel::table! {
    metas (id) {
        id -> Varchar,
        id_usuario -> Varchar,
        titulo -> Varchar,
        descricao -> Nullable<Varchar>,
        tipo -> Varchar,
        categoria -> Varchar,
        valor_alvo -> Int4,
        valor_atual -> Int4,
        unidade -> Nullable<Varchar>,
        data_inicio -> Timestamp,
        data_fim -> Nullable<Timestamp>,
        eh_ativa -> Bool,
        eh_concluida -> Bool,
        concluida_em -> Nullable<Timestamp>,
        lembrete_ativo -> Bool,
        frequencia_lembrete -> Nullable<Varchar>,
        criado_em -> Timestamp,
        atualizado_em -> Timestamp,
    }
}

diesel::table! {
    sessoes_trabalho (id) {
        id -> Varchar,
        id_usuario -> Varchar,
        inicio -> Timestamp,
        fim -> Nullable<Timestamp>,
        total_minutos -> Nullable<Int4>,
        local_inicio -> Nullable<Varchar>,
        local_fim -> Nullable<Varchar>,
        total_corridas -> Int4,
        total_ganhos -> Int4,
        total_gastos -> Int4,
        plataforma -> Nullable<Varchar>,
        observacoes -> Nullable<Varchar>,
        clima -> Nullable<Varchar>,
        eh_ativa -> Bool,
        criado_em -> Timestamp,
        atualizado_em -> Timestamp,
    }
}

diesel::table! {
    transacoes (id) {
        id -> Varchar,
        id_usuario -> Varchar,
        id_categoria -> Varchar,
        valor -> Int4,
        descricao -> Nullable<Varchar>,
        tipo -> Varchar,
        data -> Timestamp,
        origem -> Nullable<Varchar>,
        id_externo -> Nullable<Varchar>,
        plataforma -> Nullable<Varchar>,
        observacoes -> Nullable<Varchar>,
        tags -> Nullable<Varchar>,
        criado_em -> Timestamp,
        atualizado_em -> Timestamp,
    }
}

diesel::table! {
    usuarios (id) {
        id -> Varchar,
        nome_usuario -> Varchar,
        email -> Varchar,
        senha -> Nullable<Varchar>,
        nome_completo -> Nullable<Varchar>,
        telefone -> Nullable<Varchar>,
        veiculo -> Nullable<Varchar>,
        data_inicio_atividade -> Nullable<Date>,
        eh_pago -> Bool,
        id_pagamento -> Nullable<Varchar>,
        metodo_pagamento -> Nullable<Varchar>,
        status_pagamento -> Varchar,
        tipo_assinatura -> Varchar,
        trial_termina_em -> Nullable<Timestamp>,
        criado_em -> Timestamp,
        atualizado_em -> Timestamp,
        ultima_tentativa_redefinicao -> Nullable<Timestamp>,
        address -> Varchar,
        address_number -> Varchar,
        complement -> Varchar,
        postal_code -> Varchar,
        province -> Varchar,
        city -> Varchar,
    cpfcnpj -> Nullable<Varchar>,
    }
}

diesel::joinable!(assinaturas -> usuarios (id_usuario));
diesel::joinable!(categorias -> usuarios (id_usuario));
diesel::joinable!(configuracoes -> usuarios (id_usuario));
diesel::joinable!(metas -> usuarios (id_usuario));
diesel::joinable!(sessoes_trabalho -> usuarios (id_usuario));
diesel::joinable!(transacoes -> categorias (id_categoria));
diesel::joinable!(transacoes -> usuarios (id_usuario));

diesel::allow_tables_to_appear_in_same_query!(
    assinaturas,
    categorias,
    configuracoes,
    metas,
    sessoes_trabalho,
    transacoes,
    usuarios,
);
