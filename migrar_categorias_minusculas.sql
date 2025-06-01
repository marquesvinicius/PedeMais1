-- Script de migração para normalizar categorias existentes
-- PedeMais1 - Sistema de Gerenciamento de Pedidos

-- Este script converte todas as categorias existentes para minúsculas
-- e aplica as novas constraints

-- 1. Atualizar categorias existentes para minúsculas
UPDATE produtos SET categoria = 'lanches' WHERE UPPER(categoria) = 'LANCHES';
UPDATE produtos SET categoria = 'bebidas' WHERE UPPER(categoria) = 'BEBIDAS';
UPDATE produtos SET categoria = 'sobremesas' WHERE UPPER(categoria) = 'SOBREMESAS';
UPDATE produtos SET categoria = 'outros' WHERE UPPER(categoria) = 'OUTROS' OR UPPER(categoria) = 'ACOMPANHAMENTOS';

-- 2. Remover constraint anterior e adicionar nova
ALTER TABLE produtos DROP CONSTRAINT IF EXISTS check_categoria_produtos;
ALTER TABLE produtos ADD CONSTRAINT check_categoria_produtos 
CHECK (categoria IN ('lanches', 'bebidas', 'sobremesas', 'outros'));

-- 3. Atualizar status dos pedidos para minúsculas também (se necessário)
UPDATE pedidos SET status = 'pendente' WHERE UPPER(status) = 'PENDENTE';
UPDATE pedidos SET status = 'em preparo' WHERE UPPER(status) = 'EM PREPARO';
UPDATE pedidos SET status = 'pronto' WHERE UPPER(status) = 'PRONTO';
UPDATE pedidos SET status = 'entregue' WHERE UPPER(status) = 'ENTREGUE';
UPDATE pedidos SET status = 'cancelado' WHERE UPPER(status) = 'CANCELADO';

-- 4. Aplicar constraint de status (se não existir)
ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_status_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_status_check 
CHECK (status IN ('pendente', 'em preparo', 'pronto', 'entregue', 'cancelado'));

-- 5. Verificar se as constraints foram aplicadas corretamente
SELECT 
    conname as constraint_name, 
    consrc as constraint_definition 
FROM pg_constraint 
WHERE conname IN ('check_categoria_produtos', 'pedidos_status_check');

-- 6. Verificar dados após migração
SELECT DISTINCT categoria, COUNT(*) as quantidade 
FROM produtos 
GROUP BY categoria 
ORDER BY categoria;

SELECT DISTINCT status, COUNT(*) as quantidade 
FROM pedidos 
GROUP BY status 
ORDER BY status; 