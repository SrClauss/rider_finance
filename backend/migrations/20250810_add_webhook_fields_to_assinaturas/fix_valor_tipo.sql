-- Corrigir tipo do campo valor para inteiro
ALTER TABLE assinaturas
    ALTER COLUMN valor TYPE INTEGER USING valor::integer;
