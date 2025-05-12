// view/scripts/cardapioView.js
import * as apiCardapio from './api/apiCardapio.js'

document.addEventListener('DOMContentLoaded', () => {
    // Elementos do DOM
    const cardapioContainer = document.getElementById('produtos-container')
    const listaCardapio = document.getElementById('lista-produtos')
    const searchInput = document.getElementById('searchInput')
    const filterSelect = document.getElementById('filterSelect')
    const priceRange = document.getElementById('priceRange')
    const priceValue = document.getElementById('priceValue')

    // Estado
    let cardapio = []

    // Inicialização
    init()

    async function init() {
        try {
            await carregarCardapio()
            setupEventListeners()
        } catch (error) {
            console.error('Erro ao inicializar:', error)
            mostrarErro('Erro ao carregar o cardápio. Por favor, tente novamente.')
        }
    }

    async function carregarCardapio() {
        try {
            const data = await apiCardapio.buscarCardapio()
            console.log('Cardápio carregado:', data)

            cardapio = data
            renderizarCardapio(cardapio)
        } catch (error) {
            console.error('Erro ao carregar cardápio:', error)
            mostrarErro('Erro ao carregar cardápio. Por favor, tente novamente.')
        }
    }

    function setupEventListeners() {
        if (searchInput) {
            searchInput.addEventListener('input', filtrarCardapio)
        }
        if (filterSelect) {
            filterSelect.addEventListener('change', filtrarCardapio)
        }
        if (priceRange) {
            priceRange.addEventListener('input', (e) => {
                if (priceValue) priceValue.textContent = `R$ ${e.target.value}`
                filtrarCardapio()
            })
        }
    }

    function renderizarCardapio(cardapioFiltrado) {
        if (!listaCardapio) return

        listaCardapio.innerHTML = ''
        const categorias = [...new Set(cardapioFiltrado.map(p => p.categoria || 'Outros'))]

        categorias.forEach(categoria => {
            const itensCategoria = cardapioFiltrado.filter(p => p.categoria === categoria)
            if (itensCategoria.length > 0) {
                const categoriaElement = criarElementoCategoria(categoria)
                const itensContainer = categoriaElement.querySelector('[data-categoria]')

                if (itensContainer) {
                    itensCategoria.forEach(item => {
                        const itemElement = criarElementoItem(item)
                        itensContainer.appendChild(itemElement)
                    })
                }

                listaCardapio.appendChild(categoriaElement)
            }
        })
    }

    function criarElementoCategoria(categoria) {
        const div = document.createElement('div')
        div.className = 'cardapio-categoria mb-4'
        div.innerHTML = `
            <h3 class="categoria-titulo mb-3">${categoria}</h3>
            <div class="row" data-categoria="${categoria}">
            </div>
        `
        return div
    }

    function criarElementoItem(item) {
        const div = document.createElement('div')
        div.className = 'col-md-4 mb-4'
        div.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${item.nome}</h5>
                    <p class="card-text">${item.descricao || ''}</p>
                    <p class="card-text"><strong>R$ ${item.preco.toFixed(2)}</strong></p>
                </div>
            </div>
        `
        return div
    }

    function filtrarCardapio() {
        let cardapioFiltrado = [...cardapio]

        // Filtro de busca
        if (searchInput && searchInput.value) {
            const searchTerm = searchInput.value.toLowerCase()
            cardapioFiltrado = cardapioFiltrado.filter(
                p => p.nome.toLowerCase().includes(searchTerm) ||
                    p.descricao?.toLowerCase().includes(searchTerm)
            )
        }

        // Filtro de categoria
        if (filterSelect && filterSelect.value) {
            if (filterSelect.value === 'menos10') {
                cardapioFiltrado = cardapioFiltrado.filter((p) => p.preco < 10)
            } else if (filterSelect.value === 'mais30') {
                cardapioFiltrado = cardapioFiltrado.filter((p) => p.preco > 30)
            } else {
                cardapioFiltrado = cardapioFiltrado.filter(
                    (p) => p.categoria === filterSelect.value
                )
            }
        }

        renderizarCardapio(cardapioFiltrado)
    }

    function mostrarErro(mensagem) {
        // Implementar lógica de exibição de erro
        console.error(mensagem)
    }
})
