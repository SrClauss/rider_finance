DO $$
DECLARE
  sql TEXT;
BEGIN
  SELECT 'TRUNCATE TABLE ' ||
         string_agg(format('%I.%I', schemaname, tablename), ', ') ||
         ' RESTART IDENTITY CASCADE;'
    INTO sql
  FROM pg_tables
  WHERE schemaname NOT IN ('pg_catalog','information_schema');

  IF sql IS NOT NULL THEN
    RAISE NOTICE 'Executando: %', sql;
    EXECUTE sql;
  END IF;
END
$$