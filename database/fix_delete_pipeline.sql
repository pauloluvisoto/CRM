-- SCRIPT DE LIMPEZA DO BANCO DE DADOS
-- Rode isso no SQL Editor do Supabase para destravar a exclusão de pipelines.

-- 1. Remove a tabela legada 'columns' que está causando o erro de chave estrangeira check
DROP TABLE IF EXISTS "columns" CASCADE;

-- 2. (Opcional) Remove a tabela legada 'cards' se existir, para evitar futuros conflitos
DROP TABLE IF EXISTS "cards" CASCADE;

-- 3. Confirmação
SELECT 'Tabelas legadas removidas com sucesso' as status;
