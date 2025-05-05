// view/scripts/novoPedidoView.js
import * as apiPedidos from './api/apiPedidos.js'

let itensSelecionados = []

const mesaSelect = document.getElementById('selectMesa')
const resumoContainer = document.getElementById('resumo-pedido')
const valorTotalEl = document.getElementById('valor-total')
const btnFinalizar = document.getElementById('btn-finalizar-pedido')
const modalMesa = document.getElementById('modal-mesa')
const modalResumo = document.getElementById('modal-resumo')
const btnConfirmar = document.getElementById('btn-confirmar-pedido')

// Adiciona evento a todos os botões "adicionar"
document.querySelectorAll('.btn-adicionar').forEach(btn => {
    btn.addEventListener('click', () => {
        const card = btn.closest('.produto-card')
        const nome = card.dataset.nome
        const preco = parseFloat(card.dataset.preco)
        itensSelecionados.push({ nome, preco })
        atualizarResumo()
    })
})

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
        alert('Erro ao criar pedido.')
    }
})
