// view/scripts/adminAdicionarProdutoView.js
import { getUsuarioAtual } from './api/apiAuth.js'

document.addEventListener('DOMContentLoaded', async () => {
    const usuario = getUsuarioAtual()
    const btnAdicionar = document.getElementById('btn-abrir-modal-produto')
    const form = document.getElementById('form-novo-produto')
    const modalElement = document.getElementById('modalNovoProduto')
    const modal = new bootstrap.Modal(modalElement)
    const alerta = document.getElementById('mensagem-erro-produto')

    // Mostrar botão apenas se for admin
    if (usuario?.papel === 'admin' && btnAdicionar) {
        btnAdicionar.classList.remove('d-none')
    }

    // Abrir modal
    if (btnAdicionar && modal && form) {
        btnAdicionar.addEventListener('click', () => {
            form.reset()
            alerta.classList.add('d-none')
            modal.show()
        })
    }

    // Submeter formulário
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault()
            alerta.classList.add('d-none')

            const nome = document.getElementById('produtoNome').value.trim()
            const descricao = document.getElementById('produtoDescricao').value.trim()
            const preco = parseFloat(document.getElementById('produtoPreco').value)
            const categoria = document.getElementById('produtoCategoria').value.trim()

            if (!nome || isNaN(preco) || !categoria) {
                alerta.textContent = 'Preencha todos os campos obrigatórios.'
                alerta.classList.remove('d-none')
                return
            }

            try {
                const token = localStorage.getItem('token')

                const response = await fetch('${BASE_URL}/api/cardapio', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ nome, descricao, preco, categoria })
                })

                const text = await response.text()

                try {
                    const result = JSON.parse(text)

                    if (!response.ok) throw new Error(result.erro || 'Erro ao adicionar produto.')

                    modal.hide()
                    alert('Produto adicionado com sucesso!')
                    location.reload()

                } catch (parseError) {
                    console.error('Erro ao interpretar resposta JSON:', parseError)
                    alerta.textContent = 'Erro inesperado: resposta do servidor inválida.'
                    alerta.classList.remove('d-none')
                }

            } catch (err) {
                alerta.textContent = err.message
                alerta.classList.remove('d-none')
            }
        })
    }
})
