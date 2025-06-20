// view/scripts/pedidosView.js
import * as pedidosController from './api/apiPedidos.js'
import * as apiAuth from './api/apiAuth.js'
import * as pedidosAPI from './api/apiPedidos.js'

document.addEventListener('DOMContentLoaded', async () => {
  // Verificar autenticação
  await apiAuth.verificarAutenticacao()

  // Elementos DOM
  const pedidosContainer = document.getElementById('pedidos-container')
  const loadingSpinner = document.getElementById('loading-spinner')
  const filtroStatus = document.getElementById('filtroStatus')
  const filtroMesa = document.getElementById('filtroMesa')

  // Array para armazenar todos os pedidos
  let todosPedidos = []

  // Inicialização
  inicializarPagina()

  // Funções
  function inicializarPagina() {
    // Carregar pedidos ao iniciar
    carregarPedidos()

    // Adicionar event listeners para os filtros
    if (filtroStatus) filtroStatus.addEventListener('change', aplicarFiltros)
    if (filtroMesa) filtroMesa.addEventListener('change', aplicarFiltros)

    // Atualizar pedidos automaticamente a cada 30 segundos
    setInterval(carregarPedidos, 30000)
  }

  async function carregarPedidos() {
    try {
      // Mostrar spinner de carregamento
      if (loadingSpinner) loadingSpinner.style.display = 'block'

      const pedidos = await pedidosAPI.buscarPedidos();
      todosPedidos = pedidos

      // Atualizar o filtro de mesas
      atualizarMesasDisponiveis(pedidos)

      // Aplicar filtros atuais nos pedidos carregados
      aplicarFiltros()
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
      if (pedidosContainer) {
        // Remove a classe has-content para centralizar a mensagem de erro
        pedidosContainer.classList.remove('has-content')
        pedidosContainer.innerHTML = `
          <div class="alert alert-danger text-center empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Erro ao carregar pedidos</h3>
            <p>Não foi possível carregar os pedidos. Verifique sua conexão e tente novamente.</p>
            <button class="btn btn-primary" onclick="window.location.reload()">
              <i class="fas fa-sync-alt me-2"></i>Tentar Novamente
            </button>
          </div>
        `
      }
    } finally {
      if (loadingSpinner) loadingSpinner.style.display = 'none'
    }
  }

  function atualizarMesasDisponiveis(pedidos) {
    if (!filtroMesa) return

    const mesas = [...new Set(pedidos.map(p => p.mesa))].sort((a, b) => a - b)

    // Limpar opções existentes (exceto "Todas")
    while (filtroMesa.options.length > 1) {
      filtroMesa.remove(1)
    }

    // Adicionar opções de mesa
    mesas.forEach(mesa => {
      const option = document.createElement('option')
      option.value = mesa
      option.textContent = `Mesa ${mesa}`
      filtroMesa.appendChild(option)
    })
  }

  async function aplicarFiltros() {
    if (!filtroStatus || !filtroMesa) return

    const statusSelecionado = filtroStatus.value
    const mesaSelecionada = filtroMesa.value

    let pedidosFiltrados = [...todosPedidos]

    // Filtrar por status
    pedidosFiltrados = await pedidosController.filtrarPedidosPorStatus(pedidosFiltrados, statusSelecionado)

    // Filtrar por mesa
    pedidosFiltrados = await pedidosController.filtrarPedidosPorMesa(pedidosFiltrados, mesaSelecionada)

    renderizarPedidos(pedidosFiltrados)
  }

  function renderizarPedidos(pedidos) {
    if (!pedidosContainer) return

    pedidosContainer.innerHTML = ''

    if (pedidos.length === 0) {
      // Remove a classe has-content para centralizar a mensagem vazia
      pedidosContainer.classList.remove('has-content')
      pedidosContainer.innerHTML = `
        <div class="alert alert-info text-center empty-state pedidos-vazio">
          <i class="fas fa-clipboard-list"></i>
          <h3>Nenhum pedido encontrado</h3>
          <p>Não há pedidos que correspondam aos filtros selecionados.</p>
          <button class="btn btn-success" onclick="window.location.href='novo-pedido.html'">
            <i class="fas fa-plus me-2"></i>Criar Novo Pedido
          </button>
        </div>
      `
      return
    }

    // Adiciona a classe has-content quando há pedidos
    pedidosContainer.classList.add('has-content')

    const template = document.getElementById('pedido-template')
    if (!template) return

    pedidos.forEach(pedido => {
      const clone = template.content.cloneNode(true)

      // Atualizar as informações do pedido
      const titulo = clone.querySelector('.pedido-titulo')
      if (titulo) titulo.innerHTML = `Pedido <span class="numero-pedido">#${pedido.id.toString().padStart(3, '0')}</span> - Mesa ${pedido.mesa}`

      const itens = clone.querySelector('.pedido-itens')
      if (itens) itens.textContent = pedido.itens

      const badge = clone.querySelector('.status-badge')
      if (badge) {
        badge.textContent = pedido.status

        // Aplicar a classe de estilo de acordo com o status
        if (pedido.status.toLowerCase() === 'pendente') {
          badge.classList.add('status-pendente')
        } else if (pedido.status.toLowerCase() === 'em preparo') {
          badge.classList.add('status-preparo')
        } else if (pedido.status.toLowerCase() === 'pronto') {
          badge.classList.add('status-pronto')
        } else if (pedido.status.toLowerCase() === 'entregue') {
          badge.classList.add('status-entregue')
        } else if (pedido.status.toLowerCase() === 'cancelado') {
          badge.classList.add('status-cancelado')
        }
      }

      // Adicionar ID do pedido para referência
      const card = clone.querySelector('.pedido-card')
      if (card) {
        card.dataset.pedidoId = pedido.id
        
        // Tornar o card clicável
        card.style.cursor = 'pointer'
        card.addEventListener('click', (e) => {
          // Verificar se o clique não foi em um botão
          if (!e.target.closest('button')) {
            window.location.href = `ver-pedido.html?id=${pedido.id}`
          }
        })
        
        // Adicionar efeito hover
        card.addEventListener('mouseenter', () => {
          card.style.transform = 'translateY(-2px)'
          card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
        })
        
        card.addEventListener('mouseleave', () => {
          card.style.transform = 'translateY(0)'
          card.style.boxShadow = ''
        })
      }

      // Adicionar botões de ação para alterar status
      const actionButtons = clone.querySelector('.action-buttons')
      if (actionButtons) configurarBotoesAcao(actionButtons, pedido)

      pedidosContainer.appendChild(clone)
    })
  }

  function configurarBotoesAcao(container, pedido) {
    // Limpar botões existentes
    container.innerHTML = ''

    const status = pedido.status.toLowerCase()

    // Botão "Ver Detalhes" sempre presente
    const detalhesBtn = document.createElement('button')
    detalhesBtn.className = 'btn btn-outline-primary btn-sm me-2'
    detalhesBtn.innerHTML = '<i class="fas fa-eye me-1"></i>Ver Detalhes'
    detalhesBtn.addEventListener('click', (e) => {
      e.stopPropagation() // Evitar que o clique no card seja acionado
      window.location.href = `ver-pedido.html?id=${pedido.id}`
    })
    container.appendChild(detalhesBtn)

    // Adicionar botões apropriados com base no status atual
    if (status === 'pendente') {
      // Botão para mudar para "Em preparo"
      const iniciarBtn = document.createElement('button')
      iniciarBtn.className = 'btn btn-warning btn-sm me-2'
      iniciarBtn.innerHTML = '<i class="fas fa-play me-1"></i>Iniciar'
      iniciarBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        alterarStatus(pedido.id, 'em preparo')
      })
      container.appendChild(iniciarBtn)
    }
    else if (status === 'em preparo') {
      // Botão para marcar como "Pronto"
      const concluirBtn = document.createElement('button')
      concluirBtn.className = 'btn btn-success btn-sm'
      concluirBtn.innerHTML = '<i class="fas fa-check me-1"></i>Pronto'
      concluirBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        alterarStatus(pedido.id, 'pronto')
      })
      container.appendChild(concluirBtn)
    }
    else if (status === 'pronto') {
      // Botão para marcar como "Entregue"
      const entregarBtn = document.createElement('button')
      entregarBtn.className = 'btn btn-purple btn-sm'
      entregarBtn.innerHTML = '<i class="fas fa-truck me-1"></i>Entregar'
      entregarBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        alterarStatus(pedido.id, 'entregue')
      })
      container.appendChild(entregarBtn)
    }
  }

  async function alterarStatus(id, novoStatus) {
    try {
      await pedidosController.atualizarStatusPedido(id, novoStatus)
      // Recarregar pedidos após alterar status
      carregarPedidos()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      alert('Erro ao alterar status do pedido. Tente novamente.')
    }
  }

  // Função para controlar visibilidade do botão flutuante
  function controlarBotaoFlutuante() {
    const botaoFlutuante = document.getElementById('novo-pedido-floating')
    if (!botaoFlutuante) return

    const footer = document.querySelector('footer')
    if (!footer) return

    const footerRect = footer.getBoundingClientRect()
    const windowHeight = window.innerHeight
    
    // Ocultar o botão quando o footer estiver visível na tela
    // Adiciona uma margem de 120px para começar a ocultar antes do footer aparecer completamente
    // Isso considera a altura do próprio botão (56px) + margem de segurança
    if (footerRect.top <= windowHeight + 120) {
      botaoFlutuante.classList.add('btn-floating-hidden')
    } else {
      botaoFlutuante.classList.remove('btn-floating-hidden')
    }
  }

  // Adicionar listener de scroll apenas em mobile (quando o botão flutuante está visível)
  if (window.innerWidth < 768) {
    window.addEventListener('scroll', controlarBotaoFlutuante)
    // Verificar posição inicial
    controlarBotaoFlutuante()
    
    // Configurar expansão do botão flutuante
    configurarBotaoFlutuante()
  }

  // Também verificar quando a janela é redimensionada
  window.addEventListener('resize', () => {
    if (window.innerWidth < 768) {
      if (!window.scrollListenerAdded) {
        window.addEventListener('scroll', controlarBotaoFlutuante)
        window.scrollListenerAdded = true
      }
      controlarBotaoFlutuante()
      configurarBotaoFlutuante()
    } else {
      if (window.scrollListenerAdded) {
        window.removeEventListener('scroll', controlarBotaoFlutuante)
        window.scrollListenerAdded = false
      }
    }
  })

  // Função para configurar a expansão do botão flutuante
  function configurarBotaoFlutuante() {
    const botaoFlutuante = document.getElementById('novo-pedido-floating')
    if (!botaoFlutuante) return

    // Estado de expansão
    let isExpanded = false

    // Expandir no clique (toggle)
    botaoFlutuante.addEventListener('click', (e) => {
      // Se já está expandido, permitir navegação
      if (isExpanded) {
        return true // Permite o redirecionamento
      }
      
      // Se não está expandido, expandir primeiro
      e.preventDefault()
      isExpanded = true
      botaoFlutuante.classList.add('expanded')
      
      // Auto-colapsar após 3 segundos se não houver interação
      setTimeout(() => {
        if (isExpanded && !botaoFlutuante.matches(':hover')) {
          isExpanded = false
          botaoFlutuante.classList.remove('expanded')
        }
      }, 3000)
    })

    // Reset no mouse leave (apenas se não foi clicado)
    botaoFlutuante.addEventListener('mouseleave', () => {
      if (isExpanded) {
        // Delay para permitir clique após hover
        setTimeout(() => {
          if (!botaoFlutuante.matches(':hover')) {
            isExpanded = false
            botaoFlutuante.classList.remove('expanded')
          }
        }, 500)
      }
    })

    // Evitar colapso durante hover
    botaoFlutuante.addEventListener('mouseenter', () => {
      if (!isExpanded) {
        botaoFlutuante.classList.add('expanded')
      }
    })
  }

  /*const btnTeste = document.createElement('button')
  btnTeste.textContent = 'Criar Pedido Teste'
  btnTeste.className = 'btn btn-primary my-3'
  btnTeste.addEventListener('click', async () => {
    const pedido = {
      mesa: 9,
      itens: [
        { nome: 'Esfirra de Carne', preco: 7.5 },
        { nome: 'Suco de Maracujá', preco: 5 }
      ],
      observacoes: 'Sem gelo'
    }

    try {
      const resultado = await pedidosController.criarPedido(pedido)
      alert(`Pedido criado com sucesso (ID: ${resultado.pedido.id})`)
      carregarPedidos()
    } catch (e) {
      alert('Erro ao criar pedido: ' + e.message)
    }
  })

  document.body.prepend(btnTeste)*/
})


