// view/scripts/adminAdicionarProdutoView.js
import { getUsuarioAtual, fetchAutenticado } from './api/apiAuth.js'
import { BASE_URL } from './config.js'


document.addEventListener('DOMContentLoaded', async () => {
    const usuario = getUsuarioAtual()
    const btnAdicionar = document.getElementById('btn-abrir-modal-produto')
    const form = document.getElementById('form-novo-produto')
    const modalElement = document.getElementById('modalNovoProduto')
    const modal = new bootstrap.Modal(modalElement)
    const alerta = document.getElementById('mensagem-erro-produto')

    // Função para controlar visibilidade do botão baseado no tamanho da tela
    function controlarVisibilidadeBotao() {
        // Mostrar botão apenas se for admin E estiver em desktop (768px+)
        if (usuario?.papel === 'admin' && btnAdicionar && window.innerWidth >= 768) {
            btnAdicionar.classList.remove('d-none')
        } else if (btnAdicionar) {
            btnAdicionar.classList.add('d-none')
        }
    }

    // Verificar visibilidade inicial
    controlarVisibilidadeBotao()

    // Verificar novamente quando a janela for redimensionada
    window.addEventListener('resize', controlarVisibilidadeBotao)

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
                const response = await fetchAutenticado(`${BASE_URL}/api/cardapio`, {
                    method: 'POST',
                    body: JSON.stringify({ nome, descricao, preco, categoria })
                })

                if (!response.ok) {
                    throw new Error(`Erro ${response.status}: ${response.statusText}`)
                }

                const text = await response.text()

                if (!text.trim()) {
                    throw new Error('Resposta vazia do servidor.')
                }

                try {
                    const result = JSON.parse(text)
                    modal.hide()
                    alert('Produto adicionado com sucesso!')
                    location.reload()

                } catch (parseError) {
                    console.error('Erro ao interpretar resposta JSON:', parseError)
                    console.error('Resposta recebida:', text)
                    alerta.textContent = 'Erro inesperado: resposta do servidor inválida.'
                    alerta.classList.remove('d-none')
                }

            } catch (err) {
                console.error('Erro ao adicionar produto:', err)
                
                if (err.message === 'UNAUTHORIZED') {
                    alerta.textContent = 'Sessão expirada. Redirecionando para login...'
                    alerta.classList.remove('d-none')
                    setTimeout(() => {
                        window.location.href = '/view/loginView.html'
                    }, 2000)
                } else {
                    alerta.textContent = err.message || 'Erro desconhecido ao adicionar produto.'
                    alerta.classList.remove('d-none')
                }
            }
        })
    }
})
