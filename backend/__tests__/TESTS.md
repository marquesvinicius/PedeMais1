# 📦 PedeMais1 - Documentação de Testes Automatizados

## 🎯 Objetivo

Garantir a qualidade do código do backend do projeto PedeMais1 com testes automatizados, usando **Jest** como framework de testes.

---

## 🧪 Ferramentas Utilizadas

- **Linguagem**: JavaScript (Node.js)
- **Framework de Teste**: Jest
- **HTTP Testing**: Supertest
- **Mocks**: Jest Mocks para Supabase, JWT e Bcrypt

---

## 📁 Estrutura dos Testes

Os testes estão organizados na pasta `backend/__tests__/` e seguem os seguintes focos:

| Arquivo                   | Foco Principal                      |
|--------------------------|--------------------------------------|
| `auth.test.js`           | Autenticação de usuários (login e registro) |
| `pedidos.test.js`        | Criação, busca e atualização de pedidos |
| `cardapio.test.js`       | Listagem e adição de produtos ao cardápio |
| `middleware.test.js`     | Verificação de autenticação via JWT |
| `integracao.test.js`     | Fluxos completos: pedidos e área admin |
| `validacao.test.js`      | Testes de tipo e integridade de dados |

---

## ✅ Tipos de Testes Implementados

### Testes Unitários

- **Registro de Usuário**:
  - Verifica campos obrigatórios
  - Criptografia com bcrypt
  - Checagem de e-mail duplicado
  - Simulação de falha no Supabase

- **Login**:
  - Geração de token JWT
  - Senha incorreta
  - Usuário inexistente
  - Erros de entrada

- **Pedidos**:
  - Criação com valor total calculado
  - Verificação de campos ausentes
  - Falha na inserção
  - Atualização de status do pedido

- **Middleware**:
  - JWT válido e inválido
  - Token ausente
  - Usuário não autenticado

### Testes de Integração

- **Fluxo Completo de Pedidos**:
  - Criar pedido autenticado
  - Buscar pedidos do usuário

- **Admin - Gerenciamento de Cardápio**:
  - Apenas admins podem adicionar itens
  - Verificação de permissão por token

### Testes de Validação

- **Dados mal formatados**:
  - Preço como string
  - Nome como número
  - Mesa como string
  - Falta de campos obrigatórios

---

## 🧰 Execução dos Testes

No diretório `backend/`, execute:

```bash
# Instalar dependências de teste
npm install

# Rodar todos os testes
npm test

# Ver modo observador (retesta automaticamente)
npm run test:watch

# Rodar testes com relatório de cobertura
npm run test:coverage
```

---

## ✅ Cobertura de Testes

O projeto cobre:

- Registro e login com autenticação JWT
- Fluxos de criação e listagem de pedidos
- Validação de entrada e tipos de dados
- Acesso restrito a rotas de admin
- Testes de erro (500, 400, 401, 403)
- Integração entre controllers, rotas e middlewares

---

## 📌 Observações

- Todos os testes foram implementados de forma isolada com `jest.mock`
- Supabase é completamente simulado para evitar dependência externa
- `beforeEach` e `afterEach` limpam mocks entre testes
- Cada cenário cobre tanto o caso de sucesso quanto os principais erros esperados
- Tokens são simulados para usuários comuns e admins