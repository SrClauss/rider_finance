-- baseline migration (no-op)
-- Objetivo: marcar o estado atual do schema como baseline para começar a usar migrações.
-- Executar uma query inócua para evitar que diesel falhe com query vazia.
SELECT 1;
