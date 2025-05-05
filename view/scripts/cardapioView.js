// view/scripts/cardapioView.js
import * as apiProdutos from './api/apiProdutos.js'
import * as apiAuth from './api/apiAuth.js'


document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
    await apiAuth.verificarAutenticacao()

    // Elementos do DOM
    const produtosContainer = document.getElementById('produtos-container')
    const listaProdutos = document.getElementById('lista-produtos')
    const loadingSpinner = document.getElementById('loading-spinner')
    const filtroCategoria = document.getElementById('filtroCategoria')
    const filtroPreco = document.getElementById('filtroPreco')

    // Templates
    const categoriaTemplate = document.getElementById('categoria-template')
    const produtoTemplate = document.getElementById('produto-template')

    // Estado da aplicação
    let produtos = []
    let filtrosAtivos = {
        categoria: 'todos',
        preco: 'todos'
    }

    // Inicialização
    inicializar()

    async function inicializar() {
        await carregarProdutos()
        configurarEventListeners()
    }

    // Configuração de event listeners
    function configurarEventListeners() {
        if (filtroCategoria) filtroCategoria.addEventListener('change', aplicarFiltros)
        if (filtroPreco) filtroPreco.addEventListener('change', aplicarFiltros)
    }

    // Funções principais
    async function carregarProdutos() {
        try {
            mostrarLoading(true)

            const data = await apiProdutos.buscarCardapio()
            console.log('Produtos carregados:', data) // 👈 Adicione isso
            data.forEach(p => console.log(p));
            produtos = data
            renderizarProdutos(produtos)
        } catch (error) {
            console.error('Erro ao carregar produtos:', error)
            mostrarErro('Erro ao carregar produtos. Por favor, tente novamente.')
        } finally {
            mostrarLoading(false)
        }
    }

    function renderizarProdutos(produtosFiltrados) {
        if (!listaProdutos) return

        listaProdutos.innerHTML = ''
        const categorias = [...new Set(produtosFiltrados.map(p => p.categoria || 'Outros'))]

        categorias.forEach(categoria => {
            const produtosCategoria = produtosFiltrados.filter(p => p.categoria === categoria)
            if (produtosCategoria.length > 0) {
                const categoriaElement = criarSecaoCategoria(categoria)
                const produtosContainer = categoriaElement.querySelector('[data-categoria]')

                if (produtosContainer) {
                    produtosCategoria.forEach(produto => {
                        const produtoElement = criarCardProduto(produto)
                        produtosContainer.appendChild(produtoElement)
                    })

                    listaProdutos.appendChild(categoriaElement)
                }
            }
        })
    }

    function criarSecaoCategoria(categoria) {
        if (!categoriaTemplate) return document.createElement('div')

        const template = categoriaTemplate.content.cloneNode(true)
        const titulo = template.querySelector('.categoria-titulo')
        const container = template.querySelector('[data-categoria]')

        if (titulo) titulo.textContent = formatarTituloCategoria(categoria)
        if (container) container.dataset.categoria = categoria

        return template
    }

    function criarCardProduto(produto) {
        if (!produtoTemplate) return document.createElement('div')

        const template = produtoTemplate.content.cloneNode(true)

        const nome = template.querySelector('.produto-nome')
        const descricao = template.querySelector('.produto-descricao')
        const preco = template.querySelector('.produto-preco')
        const btnDetalhes = template.querySelector('.btn-ver-detalhes')

        if (nome) nome.textContent = produto.nome
        if (descricao) descricao.textContent = produto.descricao
        if (preco) preco.textContent = `R$ ${produto.preco.toFixed(2)}`

        if (btnDetalhes) {
            btnDetalhes.addEventListener('click', () => mostrarDetalhesProduto(produto))
        }

        return template
    }

    async function aplicarFiltros() {
        if (!filtroCategoria || !filtroPreco) return

        filtrosAtivos.categoria = filtroCategoria.value
        filtrosAtivos.preco = filtroPreco.value

        let produtosFiltrados = [...produtos]

        if (filtrosAtivos.categoria !== 'todos') {
            produtosFiltrados = produtosFiltrados.filter(
                (p) => p.categoria === filtrosAtivos.categoria
            )
        }

        if (filtrosAtivos.preco === 'menor10') {
            produtosFiltrados = produtosFiltrados.filter((p) => p.preco < 10)
        } else if (filtrosAtivos.preco === '10a30') {
            produtosFiltrados = produtosFiltrados.filter(
                (p) => p.preco >= 10 && p.preco <= 30
            )
        } else if (filtrosAtivos.preco === 'maior30') {
            produtosFiltrados = produtosFiltrados.filter((p) => p.preco > 30)
        }

        renderizarProdutos(produtosFiltrados)
    }

    function mostrarDetalhesProduto(produto) {
        // Aqui você pode abrir um modal ou preencher um container lateral
        // com as informações detalhadas do produto
        alert(
            `Detalhes do produto:\n\nNome: ${produto.nome}\nDescrição: ${produto.descricao}\nPreço: R$ ${produto.preco.toFixed(
                2
            )}`
        )
    }

    function mostrarLoading(ativo) {
        if (loadingSpinner) {
            loadingSpinner.style.display = ativo ? 'block' : 'none'
        }
    }

    function mostrarErro(mensagem) {
        alert(mensagem) // futuramente trocar por um componente visual de erro
    }

    function formatarTituloCategoria(categoria) {
        return categoria.charAt(0).toUpperCase() + categoria.slice(1)
    }
})
