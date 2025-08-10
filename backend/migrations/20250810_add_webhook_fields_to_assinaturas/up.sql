-- TODO: Copiar esta migração para a ride_test db
ALTER TABLE assinaturas
    DROP COLUMN IF EXISTS asaas_customer_id,
    DROP COLUMN IF EXISTS tipo_plano,
    ADD COLUMN billing_type VARCHAR,
    ADD COLUMN charge_type VARCHAR,
    ADD COLUMN webhook_event_id VARCHAR,
    ADD COLUMN checkout_id VARCHAR,
    ADD COLUMN checkout_status VARCHAR,
    ADD COLUMN checkout_date_created TIMESTAMP,
    ADD COLUMN checkout_event_type VARCHAR,
    ADD COLUMN valor NUMERIC,
    ADD COLUMN descricao VARCHAR,
    ADD COLUMN nome_cliente VARCHAR,
    ADD COLUMN email_cliente VARCHAR,
    ADD COLUMN cpf_cnpj_cliente VARCHAR;
