import * as apiAuth from './api/apiAuth.js'
import * as apiPedidos from './api/apiPedidos.js'

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
    await apiAuth.verificarAutenticacao()

    // Elementos DOM
    const loadingSpinner = document.getElementById('loading-spinner')
    const pedidoContent = document.getElementById('pedido-content')
    const erroContainer = document.getElementById('erro-container')
    const alertContainer = document.getElementById('alertContainer')

    // Obter ID do pedido da URL
    const urlParams = new URLSearchParams(window.location.search)
    const pedidoId = urlParams.get('id')

    if (!pedidoId) {
        mostrarErro('ID do pedido não fornecido')
        return
    }

    // Carregar dados do pedido
    await carregarPedido(pedidoId)

    // Funções
    async function carregarPedido(id) {
        try {
            loadingSpinner.style.display = 'block'
            pedidoContent.style.display = 'none'
            erroContainer.style.display = 'none'

            console.log('Carregando pedido ID:', id)

            // Buscar pedido (com fallback automático para Supabase)
            const pedido = await apiPedidos.buscarPedidoPorId(id)
            
            console.log('Pedido carregado:', pedido)
            
            if (!pedido) {
                mostrarErro('Pedido não encontrado')
                return
            }

            renderizarPedido(pedido)
            
        } catch (error) {
            console.error('Erro ao carregar pedido:', error)
            mostrarErro('Erro ao carregar dados do pedido: ' + error.message)
        } finally {
            loadingSpinner.style.display = 'none'
        }
    }

    function renderizarPedido(pedido) {
        // Título e data
        document.getElementById('pedido-titulo').innerHTML = 
            `<i class="fas fa-receipt me-3"></i>Pedido #${pedido.id.toString().padStart(3, '0')} - Mesa ${pedido.mesa}`
        
        document.getElementById('pedido-data').innerHTML = 
            `<i class="fas fa-calendar me-2"></i>${formatarData(pedido.criado_em)}`

        // Status
        const statusElement = document.getElementById('pedido-status')
        statusElement.textContent = pedido.status
        statusElement.className = `status-badge-large ${getStatusClass(pedido.status)}`

        // Resumo
        document.getElementById('pedido-mesa').textContent = pedido.mesa
        
        // Buscar e processar itens
        carregarItens(pedido)

        // Observações
        if (pedido.observacoes && pedido.observacoes.trim()) {
            document.getElementById('pedido-observacoes').textContent = pedido.observacoes
            document.getElementById('observacoes-card').style.display = 'block'
        }

        // Timeline de status
        atualizarTimeline(pedido.status)

        // Botões de ação
        renderizarAcoes(pedido)

        // Mostrar conteúdo
        pedidoContent.style.display = 'block'
    }

    async function carregarItens(pedido) {
        try {
            console.log('Carregando itens para pedido:', pedido.id)
            
            // Buscar itens da tabela itens_pedido
            let itens = await apiPedidos.buscarItensPedido(pedido.id)
            console.log('Itens da tabela itens_pedido:', itens)
            
            // Se não encontrou itens na tabela itens_pedido
            if (itens.length === 0) {
                console.log('Nenhum item encontrado na tabela itens_pedido')
                showAlert('Este pedido não possui itens detalhados. A tabela itens_pedido está vazia para este pedido.', 'warning')
            }
            
            // Atualizar interface
            document.getElementById('pedido-quantidade').textContent = `${itens.length} ${itens.length === 1 ? 'item' : 'itens'}`
            
            const total = calcularTotal(itens)
            document.getElementById('pedido-total').textContent = formatarMoeda(total)

            // Renderizar itens
            renderizarItens(itens)
            
        } catch (error) {
            console.error('Erro ao carregar itens:', error)
            
            // Mostrar erro
            document.getElementById('pedido-quantidade').textContent = '0 itens'
            document.getElementById('pedido-total').textContent = formatarMoeda(0)
            renderizarItens([])
            showAlert('Erro ao carregar itens do pedido: ' + error.message, 'danger')
        }
    }

    function processarItens(itensString) {
        try {
            // Se já é um array, retorna diretamente
            if (Array.isArray(itensString)) {
                return itensString
            }

            // Se é string JSON, faz parse
            if (typeof itensString === 'string' && itensString.startsWith('[')) {
                return JSON.parse(itensString)
            }

            // Se é string simples, converte para formato de array
            if (typeof itensString === 'string') {
                return itensString.split(',').map(item => ({
                    nome: item.trim(),
                    preco: 0,
                    quantidade: 1
                }))
            }

            return []
        } catch (error) {
            console.error('Erro ao processar itens:', error)
            return []
        }
    }

    function calcularTotal(itens) {
        return itens.reduce((total, item) => {
            const preco = parseFloat(item.preco) || 0
            const quantidade = parseInt(item.quantidade) || 1
            return total + (preco * quantidade)
        }, 0)
    }

    function renderizarItens(itens) {
        const container = document.getElementById('itens-container')
        container.innerHTML = ''

        if (itens.length === 0) {
            container.innerHTML = '<p class="text-muted">Nenhum item encontrado</p>'
            return
        }

        itens.forEach((item, index) => {
            const itemCard = document.createElement('div')
            itemCard.className = 'item-card card'
            
            const preco = parseFloat(item.preco) || 0
            const quantidade = parseInt(item.quantidade) || 1
            const subtotal = preco * quantidade

            itemCard.innerHTML = `
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-6">
                            <h6 class="mb-1">${item.nome}</h6>
                            ${quantidade > 1 ? `<small class="text-muted">Quantidade: ${quantidade}</small>` : ''}
                        </div>
                        <div class="col-md-3 text-md-center">
                            <span class="text-muted">Preço unitário:</span><br>
                            <strong>${formatarMoeda(preco)}</strong>
                        </div>
                        <div class="col-md-3 text-md-end">
                            <span class="text-muted">Subtotal:</span><br>
                            <strong class="text-success">${formatarMoeda(subtotal)}</strong>
                        </div>
                    </div>
                </div>
            `
            
            container.appendChild(itemCard)
        })
    }

    function atualizarTimeline(statusAtual) {
        const timeline = document.getElementById('status-timeline')
        const items = timeline.querySelectorAll('.timeline-item')
        
        const statusOrder = ['pendente', 'em preparo', 'pronto', 'entregue']
        const currentIndex = statusOrder.indexOf(statusAtual.toLowerCase())
        
        items.forEach((item, index) => {
            if (index <= currentIndex) {
                item.classList.add('active')
            } else {
                item.classList.remove('active')
            }
        })
    }

    function renderizarAcoes(pedido) {
        const container = document.getElementById('acoes-container')
        container.innerHTML = ''

        const status = pedido.status.toLowerCase()

        // Botão de atualizar sempre presente
        const atualizarBtn = document.createElement('button')
        atualizarBtn.className = 'btn btn-outline-primary w-100 mb-2'
        atualizarBtn.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Atualizar Dados'
        atualizarBtn.addEventListener('click', () => carregarPedido(pedido.id))
        container.appendChild(atualizarBtn)

        // Botões de mudança de status
        if (status === 'pendente') {
            const iniciarBtn = document.createElement('button')
            iniciarBtn.className = 'btn btn-warning w-100 mb-2'
            iniciarBtn.innerHTML = '<i class="fas fa-play me-2"></i>Iniciar Preparo'
            iniciarBtn.addEventListener('click', () => alterarStatus(pedido.id, 'em preparo'))
            container.appendChild(iniciarBtn)
        }
        else if (status === 'em preparo') {
            const prontoBtn = document.createElement('button')
            prontoBtn.className = 'btn btn-success w-100 mb-2'
            prontoBtn.innerHTML = '<i class="fas fa-check me-2"></i>Marcar como Pronto'
            prontoBtn.addEventListener('click', () => alterarStatus(pedido.id, 'pronto'))
            container.appendChild(prontoBtn)
        }
        else if (status === 'pronto') {
            const entregarBtn = document.createElement('button')
            entregarBtn.className = 'btn btn-primary w-100 mb-2'
            entregarBtn.innerHTML = '<i class="fas fa-truck me-2"></i>Marcar como Entregue'
            entregarBtn.addEventListener('click', () => alterarStatus(pedido.id, 'entregue'))
            container.appendChild(entregarBtn)
        }

        // Separador
        if (status !== 'entregue') {
            const hr = document.createElement('hr')
            container.appendChild(hr)
        }

        // Botão de editar (se não estiver entregue)
        if (status !== 'entregue') {
            const editarBtn = document.createElement('button')
            editarBtn.className = 'btn btn-outline-secondary w-100 mb-2'
            editarBtn.innerHTML = '<i class="fas fa-edit me-2"></i>Editar Pedido'
            editarBtn.addEventListener('click', () => {
                // TODO: Implementar edição de pedido
                showAlert('Funcionalidade de edição em desenvolvimento', 'info')
            })
            container.appendChild(editarBtn)
        }

        // Botão de excluir (apenas se pendente)
        if (status === 'pendente') {
            const excluirBtn = document.createElement('button')
            excluirBtn.className = 'btn btn-outline-danger w-100'
            excluirBtn.innerHTML = '<i class="fas fa-trash me-2"></i>Excluir Pedido'
            excluirBtn.addEventListener('click', () => confirmarExclusao(pedido.id))
            container.appendChild(excluirBtn)
        }
    }

    async function alterarStatus(id, novoStatus) {
        try {
            const botoes = document.querySelectorAll('#acoes-container button')
            botoes.forEach(btn => btn.disabled = true)

            await apiPedidos.atualizarStatusPedido(id, novoStatus)
            
            showAlert(`Status alterado para "${novoStatus}" com sucesso!`, 'success')
            
            // Recarregar dados do pedido
            setTimeout(() => carregarPedido(id), 1000)
            
        } catch (error) {
            console.error('Erro ao alterar status:', error)
            showAlert('Erro ao alterar status do pedido', 'danger')
        } finally {
            const botoes = document.querySelectorAll('#acoes-container button')
            botoes.forEach(btn => btn.disabled = false)
        }
    }

    function confirmarExclusao(id) {
        if (confirm('Tem certeza que deseja excluir este pedido?\n\nEsta ação não pode ser desfeita.')) {
            excluirPedido(id)
        }
    }

    async function excluirPedido(id) {
        try {
            await apiPedidos.excluirPedido(id)
            showAlert('Pedido excluído com sucesso!', 'success')
            
            setTimeout(() => {
                window.location.href = 'pedidos.html'
            }, 2000)
            
        } catch (error) {
            console.error('Erro ao excluir pedido:', error)
            showAlert('Erro ao excluir pedido', 'danger')
        }
    }

    function mostrarErro(mensagem) {
        loadingSpinner.style.display = 'none'
        pedidoContent.style.display = 'none'
        erroContainer.style.display = 'block'
        
        const alertElement = erroContainer.querySelector('.alert p')
        if (alertElement) {
            alertElement.textContent = mensagem
        }
    }

    function getStatusClass(status) {
        const statusLower = status.toLowerCase()
        switch (statusLower) {
            case 'pendente': return 'bg-warning text-dark'
            case 'em preparo': return 'bg-info text-white'
            case 'pronto': return 'bg-success text-white'
            case 'entregue': return 'bg-secondary text-white'
            default: return 'bg-light text-dark'
        }
    }

    function formatarData(dataString) {
        try {
            const data = new Date(dataString)
            return data.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        } catch (error) {
            return 'Data inválida'
        }
    }

    function formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor)
    }

    function showAlert(message, type) {
        if (!alertContainer) return

        const alert = document.createElement('div')
        alert.className = `alert alert-${type} alert-dismissible fade show`
        alert.role = 'alert'
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `

        alertContainer.appendChild(alert)

        // Auto-remover após 5 segundos
        setTimeout(() => {
            alert.classList.remove('show')
            setTimeout(() => {
                alert.remove()
            }, 150)
        }, 5000)
    }
}) 