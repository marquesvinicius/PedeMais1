# Documentação dos Testes - PedeMais1

## Visão Geral
Esta documentação descreve os testes automatizados implementados no sistema PedeMais1. Os testes são escritos usando Jest e cobrem as principais funcionalidades do backend.

## Configuração dos Testes
- Framework: Jest
- Ambiente: Node.js
- Cobertura mínima: 70% (branches, funções, linhas e statements)
- Diretório dos testes: `backend/__tests__/`

## Estrutura dos Testes

### 1. Testes de Autenticação (`auth.test.js`)
Testes relacionados ao sistema de autenticação e gerenciamento de usuários.

#### Funcionalidades Testadas:
- **Registro de Usuário**
  - Registro bem-sucedido de novo usuário
  - Validação de campos obrigatórios
  - Criptografia de senha
  - Tratamento de email já cadastrado

- **Login**
  - Login bem-sucedido com credenciais válidas
  - Tratamento de credenciais inválidas
  - Geração de token JWT
  - Validação de senha incorreta

### 2. Testes de Middleware (`middleware.test.js`)
Testes relacionados aos middlewares de autenticação e autorização.

#### Funcionalidades Testadas:
- **Verificação de Token**
  - Acesso permitido com token válido
  - Negação de acesso sem token
  - Tratamento de token inválido
  - Extração correta de dados do usuário

- **Verificação de Admin**
  - Acesso permitido para administradores
  - Negação de acesso para usuários comuns
  - Validação de permissões

### 3. Testes de Integração (`integracao.test.js`)
Testes que verificam a integração entre diferentes componentes do sistema.

#### Funcionalidades Testadas:
- **Fluxo de Pedidos**
  - Criação e busca de pedidos
  - Autenticação em requisições
  - Validação de respostas HTTP

- **Fluxo de Admin**
  - Acesso à área administrativa
  - Validação de permissões por papel
  - Proteção de rotas administrativas

### 4. Testes de Pedidos (`pedidos.test.js`)
Testes relacionados ao gerenciamento de pedidos do sistema.

#### Funcionalidades Testadas:
- **Criação de Pedidos**
  - Criação bem-sucedida de novo pedido
  - Validação de campos obrigatórios (mesa e itens)
  - Cálculo correto do valor total

- **Busca de Pedidos**
  - Listagem de pedidos existentes
  - Ordenação correta dos resultados

- **Atualização de Status**
  - Atualização bem-sucedida do status do pedido
  - Validação de status inválidos
  - Tratamento de erros na atualização

### 5. Testes de Cardápio (`cardapio.test.js`)
Testes relacionados ao gerenciamento do cardápio e produtos.

#### Funcionalidades Testadas:
- **Busca do Cardápio**
  - Listagem de produtos
  - Ordenação correta dos resultados

- **Adição de Produtos**
  - Adição bem-sucedida de novo produto
  - Validação de campos obrigatórios
  - Verificação de permissões (apenas admin)

### 6. Testes de Validação (`validacao.test.js`)
Testes relacionados às funções de validação de dados.

#### Funcionalidades Testadas:
- **Validação de Email**
  - Aceitação de emails válidos
  - Rejeição de emails inválidos

- **Validação de Senha**
  - Aceitação de senhas fortes
  - Rejeição de senhas fracas

- **Validação de Preço**
  - Aceitação de preços válidos
  - Rejeição de preços inválidos

## Mocks e Simulações
O sistema utiliza mocks para simular:
- Cliente Supabase
- Operações de banco de dados
- Funções de criptografia (bcrypt)
- Geração de tokens JWT
- Requisições HTTP (supertest)

## Executando os Testes

### Comandos Disponíveis:
```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com cobertura
npm run test:coverage
```

## Boas Práticas Implementadas
1. Isolamento de testes usando `beforeEach` e `afterEach`
2. Mock de console.log e console.error para evitar poluição do output
3. Validação de status HTTP e respostas JSON
4. Testes de casos de sucesso e erro
5. Verificação de permissões e validações de negócio
6. Uso de mocks dinâmicos para diferentes cenários
7. Testes de integração com supertest
8. Validação de middlewares de autenticação

## Manutenção e Atualização
Ao adicionar novos testes:
1. Seguir o padrão de nomenclatura existente
2. Manter a cobertura mínima de 70%
3. Documentar novas funcionalidades testadas
4. Atualizar os mocks conforme necessário
5. Garantir que os testes são independentes
6. Adicionar testes para novos cenários de erro 