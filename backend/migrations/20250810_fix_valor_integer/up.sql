-- Corrige o tipo do campo valor para INTEGER
ALTER TABLE assinaturas
    ALTER COLUMN valor TYPE INTEGER USING valor::integer;
