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

- **Login**
  - Login bem-sucedido com credenciais válidas
  - Tratamento de credenciais inválidas
  - Geração de token JWT

### 2. Testes de Pedidos (`pedidos.test.js`)
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

### 3. Testes de Cardápio (`cardapio.test.js`)
Testes relacionados ao gerenciamento do cardápio e produtos.

#### Funcionalidades Testadas:
- **Busca do Cardápio**
  - Listagem de produtos
  - Ordenação correta dos resultados

- **Adição de Produtos**
  - Adição bem-sucedida de novo produto
  - Validação de campos obrigatórios
  - Verificação de permissões (apenas admin)

## Mocks e Simulações
O sistema utiliza mocks para simular:
- Cliente Supabase
- Operações de banco de dados
- Funções de criptografia (bcrypt)
- Geração de tokens JWT

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

## Manutenção e Atualização
Ao adicionar novos testes:
1. Seguir o padrão de nomenclatura existente
2. Manter a cobertura mínima de 70%
3. Documentar novas funcionalidades testadas
4. Atualizar os mocks conforme necessário 