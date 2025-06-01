-- Script SQL para adicionar constraint de categoria à tabela produtos
-- PedeMais1 - Sistema de Gerenciamento de Pedidos

-- Remover constraint anterior se existir e adicionar nova constraint normalizada
ALTER TABLE produtos DROP CONSTRAINT IF EXISTS check_categoria_produtos;
ALTER TABLE produtos ADD CONSTRAINT check_categoria_produtos 
CHECK (categoria IN ('lanches', 'bebidas', 'sobremesas', 'outros'));

-- Comentário explicativo da constraint
COMMENT ON CONSTRAINT check_categoria_produtos ON produtos IS 
'Constraint que garante que a categoria do produto seja apenas: lanches, bebidas, sobremesas ou outros (minúsculas)';

-- Verificar se a constraint foi criada com sucesso
-- (Comando para verificação - opcional)
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'check_categoria_produtos';

-- Exemplo de inserção válida após constraint:
-- INSERT INTO produtos (nome, descricao, preco, categoria) 
-- VALUES ('Pizza Margherita', 'Pizza tradicional com molho de tomate, mussarela e manjericão', 25.90, 'outros');

-- Exemplo que falharia (categoria inválida):
-- INSERT INTO produtos (nome, descricao, preco, categoria) 
-- VALUES ('Teste', 'Produto teste', 10.00, 'Categoria Inválida'); -- ERRO!

-- Comando para atualizar dados existentes para minúsculas (se necessário):
-- UPDATE produtos SET categoria = LOWER(categoria) WHERE categoria IS NOT NULL; 