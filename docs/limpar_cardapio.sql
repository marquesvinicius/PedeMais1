-- Limpar todos os itens do cardápio
DELETE FROM cardapio;

-- Resetar a sequência de IDs (se estiver usando)
ALTER SEQUENCE cardapio_id_seq RESTART WITH 1;

-- Verificar se a tabela está vazia
SELECT COUNT(*) FROM cardapio; 