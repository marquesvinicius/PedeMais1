// view/scripts/novoPedidoView.js
import * as apiPedidos from './api/apiPedidos.js'
import * as apiAuth from './api/apiAuth.js'
import { BASE_URL } from './config.js'

let itensSelecionados = []
let produtos = []

const mesaSelect = document.getElementById('selectMesa')
const resumoContainer = document.getElementById('resumo-pedido')
const valorTotalEl = document.getElementById('valor-total')
const btnFinalizar = document.getElementById('btn-finalizar-pedido')
const modalMesa = document.getElementById('modal-mesa')
const modalResumo = document.getElementById('modal-resumo')
const btnConfirmar = document.getElementById('btn-confirmar-pedido')
const cardapioContainer = document.getElementById('cardapio-container')
const loadingSpinner = document.getElementById('loading-spinner')

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
    const token = localStorage.getItem('token')
    console.log('🔐 [novoPedido] Status de autenticação:', {
        tokenExiste: !!token,
        dominio: window.location.hostname,
        urlCompleta: window.location.href
    })
    
    await apiAuth.verificarAutenticacao()
    
    // Carregar produtos do cardápio
    await carregarCardapio()
})

// Carregar produtos via API
async function carregarCardapio() {
    try {
        console.log('Carregando cardápio via API...')
        
        // Buscar produtos da API
        const token = localStorage.getItem('token')
        const response = await fetch(`${BASE_URL}/api/cardapio`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.ok) {
            produtos = await response.json()
            console.log('Produtos carregados da API:', produtos)
        } else {
            console.warn('Erro ao carregar da API, usando produtos hardcoded')
            // Fallback para produtos hardcoded
            produtos = [
                {
                    id: 1,
                    nome: 'Arroz',
                    descricao: 'Arroz branco tradicional',
                    preco: 5.00,
                    categoria: 'acompanhamentos',
                    disponibilidade: true
                }
            ]
        }
        
        console.log('Produtos carregados:', produtos)
        
        // Renderizar produtos
        renderizarCardapio(produtos)
        
    } catch (error) {
        console.error('Erro ao carregar cardápio:', error)
        // Fallback para produtos hardcoded
        produtos = [
            {
                id: 1,
                nome: 'Arroz',
                descricao: 'Arroz branco tradicional',
                preco: 5.00,
                categoria: 'acompanhamentos',
                disponibilidade: true
            }
        ]
        renderizarCardapio(produtos)
    } finally {
        loadingSpinner.style.display = 'none'
    }
}

// Renderizar cardápio dinamicamente
function renderizarCardapio(produtos) {
    // Limpar container (remover placeholders)
    cardapioContainer.innerHTML = ''
    
    if (produtos.length === 0) {
        cardapioContainer.innerHTML = `
            <div class="alert alert-warning">
                <h5>Nenhum produto disponível</h5>
                <p>Não há produtos cadastrados no cardápio no momento.</p>
            </div>
        `
        return
    }
    
    // Agrupar produtos por categoria
    const categorias = {}
    produtos.forEach(produto => {
        const categoria = produto.categoria || 'outros'
        if (!categorias[categoria]) {
            categorias[categoria] = []
        }
        categorias[categoria].push(produto)
    })
    
    // Renderizar cada categoria
    Object.keys(categorias).forEach(categoria => {
        const categoriaDiv = document.createElement('div')
        categoriaDiv.className = 'categoria-container mb-4'
        
        categoriaDiv.innerHTML = `
            <h4 class="categoria-titulo">${categoria}</h4>
            <div class="row" id="categoria-${categoria.toLowerCase()}">
            </div>
        `
        
        cardapioContainer.appendChild(categoriaDiv)
        
        const produtosRow = categoriaDiv.querySelector('.row')
        
        // Renderizar produtos da categoria
        categorias[categoria].forEach(produto => {
            const produtoCard = criarCardProduto(produto)
            produtosRow.appendChild(produtoCard)
        })
    })
    
    // Configurar event listeners para os botões de adicionar
    configurarEventListeners()
}

// Criar card de produto
function criarCardProduto(produto) {
    const col = document.createElement('div')
    col.className = 'col-md-4 mb-3'
    
    col.innerHTML = `
        <div class="card produto-card" data-id="${produto.id}" data-nome="${produto.nome}" data-preco="${produto.preco}">
            <div class="card-body">
                <h5 class="card-title">${produto.nome}</h5>
                <p class="card-text">${produto.descricao || 'Sem descrição'}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="text-primary fw-bold">R$ ${produto.preco.toFixed(2)}</span>
                    <div class="produto-acoes">
                        <button class="btn btn-sm btn-primary btn-adicionar">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `
    
    return col
}

// Configurar event listeners
function configurarEventListeners() {
    // Adiciona evento a todos os botões "adicionar"
    document.querySelectorAll('.btn-adicionar').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.produto-card')
            const nome = card.dataset.nome
            const preco = parseFloat(card.dataset.preco)
            const itemCardapioId = parseInt(card.dataset.id) // ID do produto no cardápio
            
            itensSelecionados.push({ 
                nome, 
                preco, 
                quantidade: 1,
                item_cardapio_id: itemCardapioId
            })
            atualizarResumo()
        })
    })
}

// Mostrar erro
function mostrarErro(mensagem) {
    console.error(mensagem)
    // Você pode implementar um toast ou alert aqui
}

// Atualiza visual do resumo do pedido
function atualizarResumo() {
    resumoContainer.innerHTML = ''

    if (itensSelecionados.length === 0) {
        resumoContainer.innerHTML = '<div class="alert alert-info">Selecione itens do cardápio para adicionar ao pedido.</div>'
        btnFinalizar.disabled = true
        valorTotalEl.textContent = '0,00'
        return
    }

    const lista = document.createElement('ul')
    lista.className = 'list-group mb-3'

    itensSelecionados.forEach((item, index) => {
        const li = document.createElement('li')
        li.className = 'list-group-item d-flex justify-content-between align-items-center'
        li.innerHTML = `
      ${item.nome} <span>R$ ${item.preco.toFixed(2)}</span>
      <button class="btn btn-sm btn-danger" data-index="${index}"><i class="fas fa-trash"></i></button>
    `
        lista.appendChild(li)
    })

    resumoContainer.appendChild(lista)

    // Evento para remover item
    lista.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = btn.dataset.index
            itensSelecionados.splice(index, 1)
            atualizarResumo()
        })
    })

    const total = itensSelecionados.reduce((acc, item) => acc + item.preco, 0)
    valorTotalEl.textContent = total.toFixed(2)
    btnFinalizar.disabled = false
}

// Clicar em Finalizar abre modal
btnFinalizar.addEventListener('click', () => {
    const mesa = mesaSelect.value
    if (!mesa) return alert('Selecione uma mesa antes de finalizar o pedido.')

    modalMesa.textContent = mesa
    modalResumo.innerHTML = itensSelecionados.map(i => `<div>${i.nome} - R$ ${i.preco.toFixed(2)}</div>`).join('')
    new bootstrap.Modal(document.getElementById('confirmacaoModal')).show()
})

// Confirmar envio do pedido
btnConfirmar.addEventListener('click', async () => {
    const mesa = parseInt(mesaSelect.value)
    const observacoes = ''

    try {
        await apiPedidos.criarPedido({ mesa, itens: itensSelecionados, observacoes })
        alert('Pedido criado com sucesso!')
        window.location.href = 'pedidos.html'
    } catch (e) {
        console.error('Erro ao criar pedido:', e)
        alert('Erro ao criar pedido: ' + e.message)
    }
})
