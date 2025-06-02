// view/scripts/adminAdicionarProdutoView.js
import { getUsuarioAtual, fetchAutenticado } from './api/apiAuth.js'
import { BASE_URL } from './config.js'

// FUNÇÕES TEMPORÁRIAS PARA TESTE DE PAPÉIS DE USUÁRIO
function simularUsuarioAdmin() {
    const usuarioTeste = {
        id: 1,
        nome: 'Admin Teste',
        email: 'admin@teste.com',
        papel: 'admin'
    }
    
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify(usuarioTeste))
    const signature = 'test-signature'
    const tokenTeste = `${header}.${payload}.${signature}`
    
    sessionStorage.setItem('token', tokenTeste)
    console.log('🔧 Usuário ADMIN simulado para teste:', usuarioTeste)
}

function simularUsuarioFuncionario() {
    const usuarioTeste = {
        id: 2,
        nome: 'João Funcionário',
        email: 'funcionario@teste.com',
        papel: 'funcionario'
    }
    
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(JSON.stringify(usuarioTeste))
    const signature = 'test-signature'
    const tokenTeste = `${header}.${payload}.${signature}`
    
    sessionStorage.setItem('token', tokenTeste)
    console.log('🔧 Usuário FUNCIONÁRIO simulado para teste:', usuarioTeste)
}

document.addEventListener('DOMContentLoaded', async () => {
    // FUNÇÃO TEMPORÁRIA PARA TESTE
    // Descomente uma das linhas abaixo para testar
    // simularUsuarioAdmin()        // Para testar como admin
    // simularUsuarioFuncionario()  // Para testar como funcionário
    
    const usuario = getUsuarioAtual()
    const btnAdicionar = document.getElementById('btn-abrir-modal-produto')
    const form = document.getElementById('form-novo-produto')
    const modalElement = document.getElementById('modalNovoProduto')
    const modal = new bootstrap.Modal(modalElement)
    const alerta = document.getElementById('mensagem-erro-produto')

    // Função para mostrar aviso de sem permissão
    function mostrarAvisoSemPermissao() {
        const nomeUsuario = usuario?.nome || 'Usuário'
        alert(`🔒 Acesso Restrito\n\nOlá ${nomeUsuario}!\n\nApenas administradores podem adicionar produtos.\n\nSeu papel atual: ${usuario?.papel || 'Não definido'}\n\nSe você precisa desta funcionalidade, entre em contato com um administrador.`)
    }

    // Função para controlar visibilidade do botão baseado no tamanho da tela
    function controlarVisibilidadeBotao() {
        if (!btnAdicionar) return
        
        if (usuario?.papel === 'admin' && window.innerWidth >= 768) {
            // Admin em desktop - mostrar botão funcional
            btnAdicionar.classList.remove('d-none')
            // Remover event listeners anteriores se existirem
            btnAdicionar.replaceWith(btnAdicionar.cloneNode(true))
            const btnAtualizado = document.getElementById('btn-abrir-modal-produto')
            btnAtualizado.addEventListener('click', () => {
                form.reset()
                alerta.classList.add('d-none')
                modal.show()
            })
        } else if (usuario?.papel === 'funcionario' && window.innerWidth >= 768) {
            // Funcionário em desktop - mostrar botão com aviso
            btnAdicionar.classList.remove('d-none')
            btnAdicionar.title = 'Apenas administradores podem adicionar produtos'
            // Remover event listeners anteriores se existirem
            btnAdicionar.replaceWith(btnAdicionar.cloneNode(true))
            const btnAtualizado = document.getElementById('btn-abrir-modal-produto')
            btnAtualizado.addEventListener('click', (e) => {
                e.preventDefault()
                mostrarAvisoSemPermissao()
            })
        } else {
            // Outros casos - ocultar botão
            btnAdicionar.classList.add('d-none')
        }
    }

    // Verificar visibilidade inicial
    controlarVisibilidadeBotao()

    // Verificar novamente quando a janela for redimensionada
    window.addEventListener('resize', controlarVisibilidadeBotao)

    // Submeter formulário (apenas para admins)
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault()
            
            // Verificar permissão antes de enviar
            if (usuario?.papel !== 'admin') {
                mostrarAvisoSemPermissao()
                modal.hide()
                return
            }
            
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
                    // Ao invés de redirecionar, mostrar erro e fechar modal
                    alerta.textContent = 'Erro de autenticação. Você não tem permissão para esta ação.'
                    alerta.classList.remove('d-none')
                    
                    // Fechar modal após alguns segundos
                    setTimeout(() => {
                        modal.hide()
                    }, 3000)
                } else {
                    alerta.textContent = err.message || 'Erro desconhecido ao adicionar produto.'
                    alerta.classList.remove('d-none')
                }
            }
        })
    }
})
