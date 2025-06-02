# Sistema de Deletar/Desativar Produtos - PedeMais1

## 📋 **Visão Geral**

O sistema implementa duas estratégias para "remover" produtos do cardápio:

1. **Deletar Permanentemente**: Remove o produto completamente do banco de dados
2. **Desativar (Soft Delete)**: Marca o produto como inativo, mantendo histórico

## 🔧 **Como Funciona**

### **Verificação Automática**
Quando você clica no botão de deletar um produto:

1. ✅ **Sistema verifica** se o produto já foi usado em pedidos
2. 🔄 **Se NÃO foi usado**: Permite deletar permanentemente  
3. ⚠️ **Se JÁ foi usado**: Oferece opção de desativar

### **Fluxo do Usuário**

#### **Produto Nunca Usado em Pedidos**
- Clica em deletar → Confirmação → ✅ **Produto deletado permanentemente**

#### **Produto Já Usado em Pedidos**
- Clica em deletar → ⚠️ **Sistema detecta uso em pedidos**
- Aparece nova opção: *"Deseja desativar o produto?"*
- Se confirmar → ✅ **Produto desativado** (some do cardápio, mas mantém histórico)

## 🛠️ **Configuração Necessária**

### **1. Executar Migration no Banco**

Execute este SQL no **Supabase SQL Editor**:

```sql
-- Adicionar coluna 'ativo' na tabela produtos
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- Marcar todos os produtos existentes como ativos
UPDATE produtos 
SET ativo = true 
WHERE ativo IS NULL;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
```

### **2. Arquivo de Migration**
O arquivo `database-migration-ativo-produtos.sql` contém o script completo.

## 📱 **Interface do Usuário**

### **Mensagens do Sistema**

#### **Produto em Uso**
```
O produto "Nome do Produto" não pode ser deletado pois já foi usado em pedidos.

Deseja desativá-lo? Produtos desativados não aparecem mais no cardápio, 
mas mantêm o histórico de pedidos.

Clique em "OK" para desativar ou "Cancelar" para manter como está.
```

#### **Sucesso - Deletar**
```
Produto deletado com sucesso!
```

#### **Sucesso - Desativar**
```
Produto desativado com sucesso! Ele não aparecerá mais no cardápio.
```

## 🔍 **Detalhes Técnicos**

### **Funções Implementadas**

#### **`verificarProdutoEmUso(produtoId)`**
- Verifica se produto está na tabela `itens_pedido`
- Retorna `true` se está em uso, `false` se não está

#### **`deletarProduto(produtoId)`**
- Verifica uso antes de deletar
- Se em uso: lança erro explicativo
- Se não em uso: deleta permanentemente

#### **`desativarProduto(produtoId)`**
- Marca `ativo = false` na tabela `produtos`
- Produto some do cardápio mas mantém histórico

#### **`buscarCardapio()`**
- Filtra automaticamente apenas produtos ativos (`ativo = true`)
- Fallback para buscar todos se coluna `ativo` não existir

### **Tratamento de Erros**
- ✅ Verifica dependências antes de deletar
- ✅ Mensagens explicativas para usuário
- ✅ Fallback automático se estrutura do banco for diferente
- ✅ Tratamento específico para erros de chave estrangeira

## 🎯 **Benefícios**

### **Para o Negócio**
- ✅ **Integridade dos dados**: Histórico de pedidos preservado
- ✅ **Flexibilidade**: Pode reativar produtos se necessário
- ✅ **Rastreabilidade**: Mantém auditoria completa

### **Para o Usuário**
- ✅ **Interface intuitiva**: Fluxo guiado com explicações claras
- ✅ **Segurança**: Confirmações antes de ações irreversíveis
- ✅ **Transparência**: Sistema explica por que não pode deletar

### **Para Desenvolvimento**
- ✅ **Robustez**: Múltiplas camadas de verificação
- ✅ **Compatibilidade**: Funciona mesmo se estrutura do banco variar
- ✅ **Manutenibilidade**: Código bem documentado e estruturado

## 📚 **Cenários de Uso**

### **1. Produto Teste (Nunca Usado)**
- Admin adiciona produto por engano
- Deleta → **Remoção permanente** ✅

### **2. Produto Sazonal (Já Vendido)**
- Produto de verão, chegou o inverno
- Deleta → Sistema oferece **desativar** → Produto some do cardápio mas histórico mantido ✅

### **3. Mudança de Receita**
- Produto mudou completamente 
- Desativa produto antigo + Cria produto novo ✅

## 🔄 **Próximos Passos (Opcionais)**

### **Interface de Gerenciamento**
- Página para visualizar produtos desativados
- Opção de reativar produtos
- Relatório de produtos mais/menos vendidos

### **Funcionalidades Avançadas**
- Data de desativação
- Motivo da desativação
- Notificações para admins

---

**✅ Sistema pronto para uso!** Execute a migration no banco e teste a funcionalidade. 