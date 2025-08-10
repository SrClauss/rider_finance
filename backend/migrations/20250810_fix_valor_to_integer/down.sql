-- Reverte o tipo do campo valor para NUMERIC
ALTER TABLE assinaturas
    ALTER COLUMN valor TYPE NUMERIC USING valor::numeric;
