// @generated automatically by Diesel CLI.

diesel::table! {
    usuarios (id) {
        id -> Text,
        nome_usuario -> Varchar,
        email -> Varchar,
        senha -> Varchar,
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
    }
}

diesel::table! {
    categorias (id) {
        id -> Text,
        id_usuario -> Nullable<Text>,
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
    transacoes (id) {
        id -> Text,
        id_usuario -> Text,
        id_categoria -> Text,
        valor -> Integer,
        descricao -> Nullable<Text>,
        tipo -> Varchar,
        data -> Timestamp,
        origem -> Nullable<Varchar>,
        id_externo -> Nullable<Varchar>,
        plataforma -> Nullable<Varchar>,
        observacoes -> Nullable<Text>,
        tags -> Nullable<Varchar>,
        criado_em -> Timestamp,
        atualizado_em -> Timestamp,
    }
}

diesel::table! {
    sessoes_trabalho (id) {
        id -> Text,
        id_usuario -> Text,
        inicio -> Timestamp,
        fim -> Nullable<Timestamp>,
        total_minutos -> Nullable<Integer>,
        local_inicio -> Nullable<Varchar>,
        local_fim -> Nullable<Varchar>,
        total_corridas -> Integer,
        total_ganhos -> Integer,
        total_gastos -> Integer,
        plataforma -> Nullable<Varchar>,
        observacoes -> Nullable<Text>,
        clima -> Nullable<Varchar>,
        eh_ativa -> Bool,
        criado_em -> Timestamp,
        atualizado_em -> Timestamp,
    }
}

diesel::table! {
    metas (id) {
        id -> Text,
        id_usuario -> Text,
        titulo -> Varchar,
        descricao -> Nullable<Text>,
        tipo -> Varchar,
        categoria -> Varchar,
        valor_alvo -> Integer,
        valor_atual -> Integer,
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
    configuracoes (id) {
        id -> Text,
        id_usuario -> Text,
        chave -> Varchar,
        valor -> Nullable<Text>,
        categoria -> Nullable<Varchar>,
        descricao -> Nullable<Varchar>,
        tipo_dado -> Nullable<Varchar>,
        eh_publica -> Bool,
        criado_em -> Timestamp,
        atualizado_em -> Timestamp,
    }
}

diesel::table! {
    assinaturas (id) {
        id -> Text,
        id_usuario -> Text,
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

// Permit joins
diesel::joinable!(categorias -> usuarios (id_usuario));
diesel::joinable!(transacoes -> usuarios (id_usuario));
diesel::joinable!(transacoes -> categorias (id_categoria));
diesel::joinable!(sessoes_trabalho -> usuarios (id_usuario));
diesel::joinable!(metas -> usuarios (id_usuario));
diesel::joinable!(configuracoes -> usuarios (id_usuario));
diesel::joinable!(assinaturas -> usuarios (id_usuario));

diesel::allow_tables_to_appear_in_same_query!(
    usuarios,
    categorias,
    transacoes,
    sessoes_trabalho,
    metas,
    configuracoes,
    assinaturas,
);
