# Como Testar o Sistema de Controle de Acesso

## 🧪 **Configuração para Teste**

### **Arquivo: `adminAdicionarProdutoView.js`**

Nas linhas 32-34, descomente a função correspondente ao tipo de usuário que deseja testar:

```javascript
// FUNÇÃO TEMPORÁRIA PARA TESTE
// Descomente uma das linhas abaixo para testar
// simularUsuarioAdmin()        // Para testar como admin
// simularUsuarioFuncionario()  // Para testar como funcionário
```

### **Arquivo: `cardapioView.js`**

Nas linhas similares, escolha o tipo de usuário:

```javascript
// FUNÇÃO TEMPORÁRIA PARA TESTE - Simular usuário funcionário
// Descomente a linha abaixo para testar com usuário funcionário
// simularUsuarioFuncionario()

// FUNÇÃO TEMPORÁRIA PARA TESTE - Simular usuário admin  
// Descomente a linha abaixo para testar com usuário admin
// simularUsuarioAdmin()
```

### **Arquivo: `relatoriosView.js`**

Nas linhas 5-6, descomente para testar como funcionário:

```javascript
// FUNÇÃO TEMPORÁRIA PARA TESTE - Simular usuário funcionário
// Descomente a linha abaixo para testar tela de acesso restrito
// simularUsuarioFuncionario()
```

## 🔬 **Cenários de Teste**

### **1. Teste como FUNCIONÁRIO**

**Ativação:**
```javascript
simularUsuarioFuncionario()  // Descomente esta linha
```

**Comportamento Esperado:**

#### **Página Cardápio:**
- ✅ Botões de deletar produtos aparecem **acinzentados**
- ✅ Clique no botão deletar → **Aviso explicativo** (sem redirecionamento)
- ✅ Botão "Novo Item" **visível mas restrito**
- ✅ Clique em "Novo Item" → **Aviso explicativo** (sem redirecionamento)

#### **Página Relatórios:**
- ✅ **Layout original mantido** (sidebar e filtros visíveis)
- ✅ **Botão "Gerar Relatório" acinzentado** com ícone de bloqueio
- ✅ **Tooltip informativo** no botão
- ✅ **Aviso elegante** quando tenta gerar relatório
- ✅ **Experiência não intrusiva** para funcionários

### **2. Teste como ADMIN**

**Ativação:**
```javascript
simularUsuarioAdmin()  // Descomente esta linha
```

**Comportamento Esperado:**

#### **Página Cardápio:**
- ✅ Botões de deletar produtos **vermelhos funcionais**
- ✅ Clique no botão deletar → **Funcionalidade normal**
- ✅ Botão "Novo Item" **totalmente funcional**
- ✅ Modal de adicionar produto **abre normalmente**

#### **Página Relatórios:**
- ✅ **Funcionamento normal** completo
- ✅ Sidebar **visível e funcional**
- ✅ **Todos os recursos** disponíveis

## 🎯 **Mensagens de Teste**

### **Aviso para Funcionário (Cardápio):**
```
🔒 Acesso Restrito

Olá João Funcionário!

Apenas administradores podem [ação].

Seu papel atual: funcionario

Se você precisa desta funcionalidade, entre em contato com um administrador.
```

### **Aviso para Funcionário (Relatórios):**
```
🔒 Acesso Restrito aos Relatórios

Olá, João Funcionário!

Apenas administradores podem gerar e visualizar relatórios. 
Esta restrição protege informações sensíveis do negócio.

Seu papel: funcionario
Acesso necessário: Administrador

Precisa deste acesso? Entre em contato com um administrador.
```

## 📱 **Teste Mobile vs Desktop**

### **Desktop (>768px):**
- Botão "Novo Item" na navbar
- Controles de permissão funcionam

### **Mobile (<768px):**
- Botão flutuante no canto inferior direito
- Mesmo comportamento de permissões

## 🔄 **Alternância Rápida de Usuários**

Para testar rapidamente, você pode:

1. **Abrir Console do Navegador** (F12)
2. **Executar comandos:**

```javascript
// Simular Admin
simularUsuarioAdmin()
location.reload()

// Simular Funcionário  
simularUsuarioFuncionario()
location.reload()
```

## ✅ **Checklist de Teste**

### **Como Funcionário:**
- [ ] Botão deletar aparece acinzentado
- [ ] Tooltip "Apenas administradores..." aparece
- [ ] Clique no deletar → Aviso sem redirecionamento
- [ ] Botão "Novo Item" visível mas restrito
- [ ] Clique "Novo Item" → Aviso sem redirecionamento
- [ ] Página relatórios → Botão "Gerar Relatório" acinzentado
- [ ] Clique "Gerar Relatório" → Aviso elegante sem redirecionamento

### **Como Admin:**
- [ ] Botão deletar vermelho funcional
- [ ] Clique no deletar → Funcionalidade normal
- [ ] Botão "Novo Item" totalmente funcional
- [ ] Modal adicionar produto abre
- [ ] Página relatórios funciona normalmente

## 🚨 **Problemas Resolvidos**

- ✅ **Redirecionamento automático** para login removido
- ✅ **Verificação de papel** implementada
- ✅ **Avisos informativos** ao invés de bloqueio silencioso
- ✅ **Interface consistente** em todos os dispositivos
- ✅ **Experiência educativa** para funcionários
- ✅ **Controle de acesso para relatórios** implementado
- ✅ **Página de relatórios bloqueia funcionários** adequadamente

---

**🎉 Sistema completamente funcional!** 

### **Status Final:**
- ✅ **Página Cardápio**: Controle de acesso funcionando
- ✅ **Página Relatórios**: Controle de acesso funcionando
- ✅ **Página Adicionar Produtos**: Controle de acesso funcionando 