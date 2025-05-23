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
        pedidosContainer.innerHTML = `
          <div class="alert alert-danger" role="alert">
            Erro ao carregar pedidos. Por favor, tente novamente mais tarde.
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
      pedidosContainer.innerHTML = `
        <div class="alert alert-info" role="alert">
          Nenhum pedido encontrado com os filtros selecionados.
        </div>
      `
      return
    }

    const template = document.getElementById('pedido-template')
    if (!template) return

    pedidos.forEach(pedido => {
      const clone = template.content.cloneNode(true)

      // Atualizar as informações do pedido
      const titulo = clone.querySelector('.pedido-titulo')
      if (titulo) titulo.textContent = `Pedido #${pedido.id.toString().padStart(3, '0')} - Mesa ${pedido.mesa}`

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
        }
      }

      // Adicionar ID do pedido para referência
      const card = clone.querySelector('.pedido-card')
      if (card) card.dataset.pedidoId = pedido.id

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

    // Adicionar botões apropriados com base no status atual
    if (status === 'pendente') {
      // Botão para mudar para "Em preparo"
      const iniciarBtn = document.createElement('button')
      iniciarBtn.className = 'btn btn-warning btn-sm me-2'
      iniciarBtn.textContent = 'Iniciar Preparo'
      iniciarBtn.addEventListener('click', () => alterarStatus(pedido.id, 'em preparo'))
      container.appendChild(iniciarBtn)
    }
    else if (status === 'em preparo') {
      // Botão para marcar como "Pronto"
      const concluirBtn = document.createElement('button')
      concluirBtn.className = 'btn btn-success btn-sm'
      concluirBtn.textContent = 'Marcar Pronto'
      concluirBtn.addEventListener('click', () => alterarStatus(pedido.id, 'pronto'))
      container.appendChild(concluirBtn)
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


