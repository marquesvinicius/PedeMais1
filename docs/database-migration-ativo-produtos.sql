-- Migration: Adicionar coluna 'ativo' na tabela produtos
-- Execute este script no Supabase SQL Editor para habilitar soft delete de produtos

-- Adicionar a coluna 'ativo' na tabela produtos
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- Marcar todos os produtos existentes como ativos
UPDATE produtos 
SET ativo = true 
WHERE ativo IS NULL;

-- Comentário explicativo
COMMENT ON COLUMN produtos.ativo IS 'Indica se o produto está ativo (true) ou foi desativado (false). Produtos desativados não aparecem no cardápio mas mantêm histórico de pedidos.';

-- Índice para melhorar performance da consulta de produtos ativos
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);

-- Opcional: Função para facilitar a consulta de produtos ativos
CREATE OR REPLACE VIEW produtos_ativos AS
SELECT * FROM produtos 
WHERE ativo = true
ORDER BY categoria, nome; 