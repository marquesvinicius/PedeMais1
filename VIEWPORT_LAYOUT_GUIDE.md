# Sistema de Layout Viewport - PedeMais1

## Visão Geral
Sistema que permite que páginas com pouco conteúdo utilizem toda a altura da viewport, evitando scroll desnecessário. Quando elementos são adicionados, o scroll se torna naturalmente necessário.

**⚠️ IMPORTANTE:** Este sistema não interfere com a navbar ou layout principal, aplicando-se apenas aos containers de conteúdo.

## Como Aplicar

### 1. HTML - Estrutura Básica
```html
<body data-requer-auth="true">
    <nav class="navbar">...</nav>
    
    <div class="container-fluid">
        <div class="row">
            <div class="sidebar">...</div>
            
            <div class="content">
                <h2>Título da Página</h2>
                
                <!-- Container que cresce conforme necessário -->
                <div id="conteudo-principal" class="content-grow">
                    <!-- Estado vazio inicial -->
                    <div class="empty-state">
                        <i class="fas fa-chart-bar"></i>
                        <h3>Nenhum item encontrado</h3>
                        <p>Descrição do que fazer para popular a página.</p>
                        <button class="btn btn-primary">Ação Principal</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <footer>...</footer>
</body>
```

### 2. JavaScript - Controle Dinâmico
```javascript
// Quando houver conteúdo, remove a centralização
function adicionarConteudo() {
    const container = document.getElementById('conteudo-principal')
    container.classList.add('has-content')
    
    // Adicionar o conteúdo...
    container.innerHTML = '<!-- conteúdo real -->'
}

// Quando limpar/voltar ao estado vazio
function limparConteudo() {
    const container = document.getElementById('conteudo-principal')
    container.classList.remove('has-content')
    
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-chart-bar"></i>
            <h3>Nenhum item encontrado</h3>
            <p>Descrição do que fazer.</p>
        </div>
    `
}
```

## Classes CSS Disponíveis

### Layout Principal
- `.content-grow`: Container que cresce e centraliza quando vazio
- `.has-content`: Adicionar quando há conteúdo (remove centralização)

### Estados Vazios
- `.empty-state`: Estilo base para mensagens de estado vazio
- `.empty-state.pedidos-vazio`: Variação para página de pedidos
- `.empty-state.cardapio-vazio`: Variação para página de cardápio  
- `.empty-state.relatorios-vazio`: Variação para página de relatórios

## Páginas Já Implementadas

### ✅ Relatórios
- **Arquivo**: `view/pages/relatorios.html`
- **Script**: `view/scripts/relatoriosView.js`
- **Estado vazio**: Centralizado quando não há relatórios
- **Com conteúdo**: Layout normal com scroll quando necessário

### ✅ Pedidos
- **Arquivo**: `view/pages/pedidos.html`
- **Classes aplicadas**: `content-grow`
- **Estado vazio**: Centralizado quando não há pedidos

## Como Implementar em Novas Páginas

1. **NÃO modificar o body**: Manter a estrutura padrão
   ```html
   <body data-requer-auth="true">
   ```

2. **Envolver apenas o conteúdo principal**:
   ```html
   <div id="conteudo" class="content-grow">
   ```

3. **Criar estado vazio**:
   ```html
   <div class="empty-state">
       <i class="fas fa-icon-apropriado"></i>
       <h3>Título do Estado Vazio</h3>
       <p>Descrição do que fazer.</p>
   </div>
   ```

4. **Controlar no JavaScript**:
   ```javascript
   // Com conteúdo
   container.classList.add('has-content')
   
   // Sem conteúdo
   container.classList.remove('has-content')
   ```

## Benefícios

- ✅ **UX Melhorada**: Páginas vazias não desperdiçam espaço vertical
- ✅ **Responsive**: Funciona em todos os tamanhos de tela
- ✅ **Dinâmico**: Layout se adapta automaticamente ao conteúdo
- ✅ **Consistente**: Comportamento uniforme em todas as páginas
- ✅ **Compatível**: Não interfere com navbar ou footer existentes
- ✅ **Acessível**: Mantém boa navegação em qualquer estado

## Exemplos de Uso

### Página de Relatórios
- **Vazio**: Filtros centralizados, mensagem de "gerar relatório"
- **Com dados**: Layout normal com cards e tabelas

### Página de Pedidos  
- **Vazio**: Mensagem de "nenhum pedido", botão para criar
- **Com pedidos**: Lista normal com scroll quando necessário

### Página de Cardápio
- **Vazio**: Mensagem de "adicionar produtos", botão de ação
- **Com produtos**: Grid normal de produtos

## Mudanças Técnicas

### ❌ Removido (causava problemas):
- Classe `.viewport-layout` no `<body>`
- Modificações diretas no layout da navbar

### ✅ Nova abordagem:
- Aplicação específica apenas ao conteúdo
- Altura calculada considerando navbar e footer
- Compatibilidade total com layout existente 