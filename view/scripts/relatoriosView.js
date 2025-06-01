import * as apiAuth from './api/apiAuth.js'
import { BASE_URL } from './config.js'

// Função para obter token válido (sessão primeiro, depois localStorage)
function obterTokenValido() {
    return sessionStorage.getItem('token') || localStorage.getItem('token')
}

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação
    await apiAuth.verificarAutenticacao()

    // Reutilizar instância do Supabase existente
    const supabaseInstance = window.supabase ? 
        (window.supabaseClient || window.supabase.createClient(
            'https://kecthdahzuzjoilfntiq.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlY3RoZGFoenV6am9pbGZudGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzODE5NjEsImV4cCI6MjA2MTk1Nzk2MX0.3jFEYqQFr00hE4jmNtE7iZjXqbei5MgpVD_IRwiGKkw'
        )) : null

    // Armazenar instância para reutilização
    if (supabaseInstance && !window.supabaseClient) {
        window.supabaseClient = supabaseInstance
    }

    // Elementos do DOM
    const dataInicial = document.getElementById('data-inicial')
    const dataFinal = document.getElementById('data-final')
    const tipoRelatorio = document.getElementById('tipo-relatorio')
    const btnGerar = document.getElementById('btn-gerar-relatorio')
    const btnLimpar = document.getElementById('btn-limpar-filtros')
    const loadingSpinner = document.getElementById('loading-spinner')
    const conteudoRelatorio = document.getElementById('conteudo-relatorio')
    const cardsResumo = document.getElementById('cards-resumo')

    // Event listeners
    btnGerar.addEventListener('click', gerarRelatorio)
    btnLimpar.addEventListener('click', limparFiltros)

    // Definir data padrão (últimos 30 dias)
    definirDatasPadrao()

    async function gerarRelatorio() {
        try {
            mostrarLoading(true)
            
            const filtros = {
                dataInicial: dataInicial.value,
                dataFinal: dataFinal.value,
                tipo: tipoRelatorio.value
            }

            let dados
            try {
                // Tentar buscar do backend primeiro
                dados = await buscarRelatorio(filtros)
                console.log('✅ Dados obtidos do backend')
            } catch (error) {
                if (error.message.includes('404') || error.message.includes('Not Found')) {
                    console.log('📊 Usando dados reais do Supabase')
                    dados = await buscarDadosSupabase(filtros)
                    mostrarAvisoSupabaseDireto()
                } else {
                    throw error
                }
            }

            renderizarRelatorio(dados, filtros.tipo)

        } catch (error) {
            console.error('Erro ao gerar relatório:', error)
            mostrarErro('Erro ao gerar relatório. Tente novamente.')
        } finally {
            mostrarLoading(false)
        }
    }

    async function buscarRelatorio(filtros) {
        const token = obterTokenValido()
        const params = new URLSearchParams()
        
        if (filtros.dataInicial) params.append('dataInicial', filtros.dataInicial)
        if (filtros.dataFinal) params.append('dataFinal', filtros.dataFinal)

        const endpoint = `/api/relatorios/${filtros.tipo}`
        const url = `${BASE_URL}${endpoint}?${params.toString()}`

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        // Se receber 403/401, limpar tokens inválidos e redirecionar
        if (response.status === 403 || response.status === 401) {
            sessionStorage.removeItem('token')
            localStorage.removeItem('token')
            window.location.href = '../../index.html'
            return null
        }

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Rotas de relatórios não encontradas (404)')
            }
            
            const error = await response.json()
            throw new Error(error.erro || 'Erro ao buscar relatório')
        }

        return await response.json()
    }

    async function buscarDadosSupabase(filtros) {
        if (!supabaseInstance) {
            throw new Error('Supabase não disponível')
        }

        const usuarioAtual = apiAuth.getUsuarioAtual()
        
        if (!usuarioAtual) {
            throw new Error('Usuário não autenticado')
        }

        const usuarioId = usuarioAtual.id

        // Construir query base
        let query = supabaseInstance
            .from('pedidos')
            .select('*')
            .eq('criado_por', usuarioId)
            .order('criado_em', { ascending: false })

        // Aplicar filtros de data
        if (filtros.dataInicial) {
            query = query.gte('criado_em', filtros.dataInicial)
        }
        if (filtros.dataFinal) {
            const dataFinalCompleta = new Date(filtros.dataFinal)
            dataFinalCompleta.setHours(23, 59, 59, 999)
            query = query.lte('criado_em', dataFinalCompleta.toISOString())
        }

        const { data: pedidos, error } = await query

        if (error) {
            console.error('Erro do Supabase:', error)
            throw new Error('Erro ao buscar dados do Supabase: ' + error.message)
        }

        // Processar dados conforme o tipo de relatório
        switch (filtros.tipo) {
            case 'geral':
                return { pedidos }

            case 'vendas':
                return processarRelatorioVendas(pedidos, filtros)

            case 'mesas':
                return processarRelatorioPorMesa(pedidos)

            default:
                return { pedidos }
        }
    }

    function processarRelatorioVendas(pedidos, filtros) {
        const totalPedidos = pedidos.length
        const totalVendas = pedidos.reduce((acc, pedido) => acc + (pedido.valor_total || 0), 0)
        const pedidosPorStatus = pedidos.reduce((acc, pedido) => {
            acc[pedido.status] = (acc[pedido.status] || 0) + 1
            return acc
        }, {})

        const ticketMedio = totalPedidos > 0 ? totalVendas / totalPedidos : 0

        return {
            resumo: {
                totalPedidos,
                totalVendas: parseFloat(totalVendas.toFixed(2)),
                ticketMedio: parseFloat(ticketMedio.toFixed(2)),
                pedidosPorStatus
            },
            periodo: {
                dataInicial: filtros.dataInicial || 'Início',
                dataFinal: filtros.dataFinal || 'Hoje'
            }
        }
    }

    function processarRelatorioPorMesa(pedidos) {
        const relatorioPorMesa = pedidos.reduce((acc, pedido) => {
            const mesa = pedido.mesa
            if (!acc[mesa]) {
                acc[mesa] = {
                    mesa,
                    totalPedidos: 0,
                    totalVendas: 0,
                    pedidosPorStatus: {}
                }
            }
            
            acc[mesa].totalPedidos++
            acc[mesa].totalVendas += pedido.valor_total || 0
            acc[mesa].pedidosPorStatus[pedido.status] = (acc[mesa].pedidosPorStatus[pedido.status] || 0) + 1
            
            return acc
        }, {})

        const resultado = Object.values(relatorioPorMesa)
            .sort((a, b) => a.mesa - b.mesa)
            .map(item => ({
                ...item,
                totalVendas: parseFloat(item.totalVendas.toFixed(2))
            }))

        return { relatorio: resultado }
    }

    function mostrarAvisoSupabaseDireto() {
        // Adicionar aviso no topo do conteúdo
        const avisoSupabase = document.createElement('div')
        avisoSupabase.className = 'alert alert-success mb-3'
        avisoSupabase.innerHTML = `
            <i class="fas fa-database me-2"></i>
            <strong>Dados Reais do Supabase:</strong> Exibindo seus dados reais diretamente do banco de dados. 
            Após o deploy do backend, os relatórios usarão as rotas otimizadas.
        `
        
        const conteudo = document.getElementById('conteudo-relatorio')
        conteudo.insertBefore(avisoSupabase, conteudo.firstChild)
    }

    function gerarDadosDemonstracao(tipo) {
        const hoje = new Date()
        const ontem = new Date(hoje)
        ontem.setDate(hoje.getDate() - 1)
        
        const anteontem = new Date(hoje)
        anteontem.setDate(hoje.getDate() - 2)

        switch (tipo) {
            case 'geral':
                return {
                    pedidos: [
                        {
                            id: 1,
                            mesa: 1,
                            status: 'entregue',
                            valor_total: 45.90,
                            criado_em: hoje.toISOString()
                        },
                        {
                            id: 2,
                            mesa: 3,
                            status: 'pronto',
                            valor_total: 32.50,
                            criado_em: ontem.toISOString()
                        },
                        {
                            id: 3,
                            mesa: 2,
                            status: 'em preparo',
                            valor_total: 28.90,
                            criado_em: ontem.toISOString()
                        },
                        {
                            id: 4,
                            mesa: 1,
                            status: 'pendente',
                            valor_total: 52.00,
                            criado_em: anteontem.toISOString()
                        },
                        {
                            id: 5,
                            mesa: 4,
                            status: 'entregue',
                            valor_total: 38.75,
                            criado_em: anteontem.toISOString()
                        }
                    ]
                }

            case 'vendas':
                return {
                    resumo: {
                        totalPedidos: 5,
                        totalVendas: 198.05,
                        ticketMedio: 39.61,
                        pedidosPorStatus: {
                            'pendente': 1,
                            'em preparo': 1,
                            'pronto': 1,
                            'entregue': 2
                        }
                    },
                    periodo: {
                        dataInicial: dataInicial.value || 'Início',
                        dataFinal: dataFinal.value || 'Hoje'
                    }
                }

            case 'mesas':
                return {
                    relatorio: [
                        {
                            mesa: 1,
                            totalPedidos: 2,
                            totalVendas: 97.90,
                            pedidosPorStatus: {
                                'entregue': 1,
                                'pendente': 1
                            }
                        },
                        {
                            mesa: 2,
                            totalPedidos: 1,
                            totalVendas: 28.90,
                            pedidosPorStatus: {
                                'em preparo': 1
                            }
                        },
                        {
                            mesa: 3,
                            totalPedidos: 1,
                            totalVendas: 32.50,
                            pedidosPorStatus: {
                                'pronto': 1
                            }
                        },
                        {
                            mesa: 4,
                            totalPedidos: 1,
                            totalVendas: 38.75,
                            pedidosPorStatus: {
                                'entregue': 1
                            }
                        }
                    ]
                }

            default:
                return { pedidos: [] }
        }
    }

    function mostrarAvisoDemonstracao() {
        // Adicionar aviso no topo do conteúdo
        const avisoDemo = document.createElement('div')
        avisoDemo.className = 'alert alert-info mb-3'
        avisoDemo.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            <strong>Modo Demonstração:</strong> Exibindo dados de exemplo para teste da funcionalidade. 
            Em produção, mostrará seus dados reais do Supabase.
        `
        
        const conteudo = document.getElementById('conteudo-relatorio')
        conteudo.insertBefore(avisoDemo, conteudo.firstChild)
    }

    function renderizarRelatorio(dados, tipo) {
        // Controla o layout baseado na presença de conteúdo
        const conteudoContainer = document.getElementById('conteudo-relatorio')
        
        // Marca que há conteúdo, removendo a centralização
        conteudoContainer.classList.add('has-content')
        
        cardsResumo.style.display = 'block'
        
        switch (tipo) {
            case 'geral':
                renderizarRelatorioGeral(dados)
                break
            case 'vendas':
                renderizarRelatorioVendas(dados)
                break
            case 'mesas':
                renderizarRelatorioPorMesa(dados)
                break
        }
    }

    function renderizarRelatorioGeral(dados) {
        cardsResumo.style.display = 'none'
        
        const pedidos = dados.pedidos || []
        
        let html = `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="fas fa-list me-2"></i>Relatório Geral de Pedidos
                    </h5>
                </div>
                <div class="card-body">
        `

        if (pedidos.length === 0) {
            html += `
                <div class="alert alert-warning text-center">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Nenhum pedido encontrado no período selecionado.
                </div>
            `
        } else {
            html += `
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Mesa</th>
                                <th>Status</th>
                                <th>Valor Total</th>
                                <th>Data</th>
                            </tr>
                        </thead>
                        <tbody>
            `

            pedidos.forEach(pedido => {
                const data = new Date(pedido.criado_em).toLocaleDateString('pt-BR')
                const valor = pedido.valor_total ? `R$ ${pedido.valor_total.toFixed(2)}` : 'N/A'
                
                html += `
                    <tr>
                        <td>#${pedido.id.toString().padStart(3, '0')}</td>
                        <td>Mesa ${pedido.mesa}</td>
                        <td><span class="badge bg-${getStatusColor(pedido.status)}">${pedido.status}</span></td>
                        <td>${valor}</td>
                        <td>${data}</td>
                    </tr>
                `
            })

            html += `
                        </tbody>
                    </table>
                </div>
            `
        }

        html += `
                </div>
            </div>
        `

        conteudoRelatorio.innerHTML = html
    }

    function renderizarRelatorioVendas(dados) {
        const resumo = dados.resumo || {}
        const periodo = dados.periodo || {}

        // Mostrar cards de resumo
        cardsResumo.style.display = 'flex'
        document.getElementById('total-pedidos').textContent = resumo.totalPedidos || 0
        document.getElementById('total-vendas').textContent = `R$ ${(resumo.totalVendas || 0).toFixed(2)}`
        document.getElementById('ticket-medio').textContent = `R$ ${(resumo.ticketMedio || 0).toFixed(2)}`
        document.getElementById('periodo-relatorio').textContent = `${periodo.dataInicial} até ${periodo.dataFinal}`

        // Gráfico de pedidos por status
        let html = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">
                                <i class="fas fa-chart-pie me-2"></i>Pedidos por Status
                            </h5>
                        </div>
                        <div class="card-body">
        `

        const pedidosPorStatus = resumo.pedidosPorStatus || {}
        
        if (Object.keys(pedidosPorStatus).length === 0) {
            html += `
                <div class="alert alert-warning text-center">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Nenhum dado disponível.
                </div>
            `
        } else {
            Object.entries(pedidosPorStatus).forEach(([status, quantidade]) => {
                const porcentagem = resumo.totalPedidos > 0 ? (quantidade / resumo.totalPedidos * 100).toFixed(1) : 0
                html += `
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="badge bg-${getStatusColor(status)}">${status}</span>
                            <span>${quantidade} (${porcentagem}%)</span>
                        </div>
                        <div class="progress">
                            <div class="progress-bar bg-${getStatusColor(status)}" 
                                 style="width: ${porcentagem}%"></div>
                        </div>
                    </div>
                `
            })
        }

        html += `
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">
                                <i class="fas fa-info-circle me-2"></i>Informações Adicionais
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-6">
                                    <div class="border-end">
                                        <h4 class="text-primary">${resumo.totalPedidos || 0}</h4>
                                        <small class="text-muted">Total de Pedidos</small>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <h4 class="text-success">R$ ${(resumo.totalVendas || 0).toFixed(2)}</h4>
                                    <small class="text-muted">Faturamento Total</small>
                                </div>
                            </div>
                            <hr>
                            <div class="text-center">
                                <h5 class="text-info">R$ ${(resumo.ticketMedio || 0).toFixed(2)}</h5>
                                <small class="text-muted">Ticket Médio por Pedido</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `

        conteudoRelatorio.innerHTML = html
    }

    function renderizarRelatorioPorMesa(dados) {
        cardsResumo.style.display = 'none'
        
        const relatorio = dados.relatorio || []
        
        let html = `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">
                        <i class="fas fa-table me-2"></i>Relatório por Mesa
                    </h5>
                </div>
                <div class="card-body">
        `

        if (relatorio.length === 0) {
            html += `
                <div class="alert alert-warning text-center">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Nenhum dado encontrado no período selecionado.
                </div>
            `
        } else {
            html += `
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Mesa</th>
                                <th>Total de Pedidos</th>
                                <th>Total de Vendas</th>
                                <th>Ticket Médio</th>
                                <th>Status dos Pedidos</th>
                            </tr>
                        </thead>
                        <tbody>
            `

            relatorio.forEach(mesa => {
                const ticketMedio = mesa.totalPedidos > 0 ? (mesa.totalVendas / mesa.totalPedidos).toFixed(2) : '0.00'
                
                let statusHtml = ''
                Object.entries(mesa.pedidosPorStatus || {}).forEach(([status, quantidade]) => {
                    statusHtml += `<span class="badge bg-${getStatusColor(status)} me-1">${status}: ${quantidade}</span>`
                })

                html += `
                    <tr>
                        <td><strong>Mesa ${mesa.mesa}</strong></td>
                        <td>${mesa.totalPedidos}</td>
                        <td>R$ ${mesa.totalVendas.toFixed(2)}</td>
                        <td>R$ ${ticketMedio}</td>
                        <td>${statusHtml}</td>
                    </tr>
                `
            })

            html += `
                        </tbody>
                    </table>
                </div>
            `
        }

        html += `
                </div>
            </div>
        `

        conteudoRelatorio.innerHTML = html
    }

    function getStatusColor(status) {
        const statusLimpo = status ? status.toString().toLowerCase().trim() : ''
        
        switch (statusLimpo) {
            case 'pendente': return 'warning'
            case 'em preparo': return 'warning-preparo'
            case 'pronto': return 'success'
            case 'entregue': return 'primary'
            case 'cancelado': return 'danger'
            default: return 'secondary'
        }
    }

    function definirDatasPadrao() {
        const hoje = new Date()
        const trintaDiasAtras = new Date()
        trintaDiasAtras.setDate(hoje.getDate() - 30)

        dataInicial.value = trintaDiasAtras.toISOString().split('T')[0]
        dataFinal.value = hoje.toISOString().split('T')[0]
    }

    function limparFiltros() {
        dataInicial.value = ''
        dataFinal.value = ''
        tipoRelatorio.value = 'geral'
        
        // Esconder cards de resumo e mostrar estado vazio
        cardsResumo.style.display = 'none'
        
        // Voltar ao estado vazio centralizado
        const conteudoContainer = document.getElementById('conteudo-relatorio')
        conteudoContainer.classList.remove('has-content')
        
        conteudoRelatorio.innerHTML = `
            <div class="alert alert-info text-center empty-state">
                <i class="fas fa-chart-bar"></i>
                <h3>Nenhum relatório gerado</h3>
                <p>Selecione os filtros e clique em "Gerar Relatório" para visualizar os dados.</p>
            </div>
        `
        
        definirDatasPadrao()
    }

    function mostrarLoading(mostrar) {
        loadingSpinner.style.display = mostrar ? 'block' : 'none'
        btnGerar.disabled = mostrar
    }

    function mostrarErro(mensagem) {
        conteudoRelatorio.innerHTML = `
            <div class="alert alert-danger text-center">
                <i class="fas fa-exclamation-circle me-2"></i>
                ${mensagem}
            </div>
        `
    }

    function mostrarErroDeployPendente() {
        cardsResumo.style.display = 'none'
        conteudoRelatorio.innerHTML = `
            <div class="alert alert-warning text-center">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <h5 class="mb-3">Funcionalidade de Relatórios em Deploy</h5>
                <p class="mb-3">
                    As rotas de relatórios foram implementadas mas ainda não foram deployadas no servidor de produção.
                </p>
                <div class="mb-3">
                    <strong>Para testar localmente:</strong>
                    <ol class="text-start mt-2">
                        <li>Execute o servidor backend local na porta 5000</li>
                        <li>A funcionalidade funcionará perfeitamente com dados reais do Supabase</li>
                    </ol>
                </div>
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    <strong>Status:</strong> Implementação completa ✅ | Deploy pendente ⏳
                </div>
            </div>
        `
    }
})
