// view/scripts/cardapioView.js
import * as apiProdutos from './api/apiProdutos.js'
import * as apiAuth from './api/apiAuth.js'
import { waitForSupabase } from '../../supabase.js'

document.addEventListener('DOMContentLoaded', async () => {
    // Verificar autenticação - temporariamente desabilitado para debug
    // await apiAuth.verificarAutenticacao()

    // Elementos do DOM
    const produtosContainer = document.getElementById('produtos-container')
    const listaProdutos = document.getElementById('lista-produtos')
    const loadingSpinner = document.getElementById('loading-spinner')
    const filtroCategoria = document.getElementById('filtroCategoria')
    const filtroPreco = document.getElementById('filtroPreco')

    // Templates
    const categoriaTemplate = document.getElementById('categoria-template')
    const produtoTemplate = document.getElementById('produto-template')

    // Estado da aplicação
    let produtos = []
    let filtrosAtivos = {
        categoria: 'todos',
        preco: 'todos'
    }

    // Inicialização
    inicializar()

    async function inicializar() {
        await carregarProdutos()
        configurarEventListeners()
    }

    // Configuração de event listeners
    function configurarEventListeners() {
        if (filtroCategoria) filtroCategoria.addEventListener('change', aplicarFiltros)
        if (filtroPreco) filtroPreco.addEventListener('change', aplicarFiltros)
    }

    // Função para adicionar produtos de teste
    async function adicionarProdutosTeste() {
        try {
            const supabase = await waitForSupabase()
            
            if (!supabase) {
                throw new Error('Supabase não disponível')
            }

            const testProducts = [
                {
                    nome: 'Hambúrguer Clássico',
                    categoria: 'lanches',
                    preco: 25.90,
                    descricao: 'Hambúrguer artesanal com carne, queijo, alface e tomate'
                },
                {
                    nome: 'Coca-Cola 350ml',
                    categoria: 'bebidas',
                    preco: 5.50,
                    descricao: 'Refrigerante gelado'
                },
                {
                    nome: 'Brigadeiro',
                    categoria: 'sobremesas',
                    preco: 3.50,
                    descricao: 'Doce de chocolate tradicional'
                },
                {
                    nome: 'Pizza Margherita',
                    categoria: 'lanches',
                    preco: 35.00,
                    descricao: 'Pizza com molho de tomate, mussarela e manjericão'
                },
                {
                    nome: 'Suco de Laranja',
                    categoria: 'bebidas',
                    preco: 8.00,
                    descricao: 'Suco natural de laranja'
                },
                {
                    nome: 'Pudim de Leite',
                    categoria: 'sobremesas',
                    preco: 7.50,
                    descricao: 'Pudim cremoso de leite condensado'
                }
            ]

            const { error } = await supabase
                .from('produtos')
                .insert(testProducts)

            if (error) {
                throw error
            }

            console.log('Produtos de teste adicionados com sucesso!')
            return true
        } catch (error) {
            console.error('Erro ao adicionar produtos de teste:', error)
            return false
        }
    }

    // Funções principais
    async function carregarProdutos() {
        try {
            mostrarLoading(true)

            const data = await apiProdutos.buscarCardapio()
            console.log('Produtos carregados:', data)
            
            // Se não há produtos, adicionar produtos de teste
            if (data.length === 0) {
                console.log('Nenhum produto encontrado. Adicionando produtos de teste...')
                const sucesso = await adicionarProdutosTeste()
                
                if (sucesso) {
                    // Recarregar produtos após adicionar dados de teste
                    const novosData = await apiProdutos.buscarCardapio()
                    produtos = novosData
                } else {
                    produtos = data
                }
            } else {
                produtos = data
            }
            
            renderizarProdutos(produtos)
        } catch (error) {
            console.error('Erro ao carregar produtos:', error)
            mostrarErro('Erro ao carregar produtos. Por favor, tente novamente.')
        } finally {
            mostrarLoading(false)
        }
    }

    function renderizarProdutos(produtosFiltrados) {
        if (!listaProdutos) return

        listaProdutos.innerHTML = ''
        const categorias = [...new Set(produtosFiltrados.map(p => p.categoria || 'outros'))]

        categorias.forEach(categoria => {
            const produtosCategoria = produtosFiltrados.filter(p => p.categoria === categoria)
            if (produtosCategoria.length > 0) {
                const categoriaElement = criarSecaoCategoria(categoria)
                const produtosContainer = categoriaElement.querySelector('[data-categoria]')

                if (produtosContainer) {
                    produtosCategoria.forEach(produto => {
                        const produtoElement = criarCardProduto(produto)
                        produtosContainer.appendChild(produtoElement)
                    })

                    listaProdutos.appendChild(categoriaElement)
                }
            }
        })
    }

    function criarSecaoCategoria(categoria) {
        if (!categoriaTemplate) return document.createElement('div')

        const template = categoriaTemplate.content.cloneNode(true)
        const titulo = template.querySelector('.categoria-titulo')
        const container = template.querySelector('[data-categoria]')

        if (titulo) titulo.textContent = formatarTituloCategoria(categoria)
        if (container) container.dataset.categoria = categoria

        return template
    }

    function criarCardProduto(produto) {
        if (!produtoTemplate) return document.createElement('div')

        const template = produtoTemplate.content.cloneNode(true)

        const nome = template.querySelector('.produto-nome')
        const descricao = template.querySelector('.produto-descricao')
        const preco = template.querySelector('.produto-preco')
        const btnDetalhes = template.querySelector('.btn-ver-detalhes')

        if (nome) nome.textContent = produto.nome
        if (descricao) descricao.textContent = produto.descricao
        if (preco) preco.textContent = `R$ ${produto.preco.toFixed(2)}`

        if (btnDetalhes) {
            btnDetalhes.addEventListener('click', () => mostrarDetalhesProduto(produto))
        }

        return template
    }

    async function aplicarFiltros() {
        if (!filtroCategoria || !filtroPreco) return

        filtrosAtivos.categoria = filtroCategoria.value
        filtrosAtivos.preco = filtroPreco.value

        let produtosFiltrados = [...produtos]

        if (filtrosAtivos.categoria !== 'todos') {
            produtosFiltrados = produtosFiltrados.filter(
                (p) => p.categoria === filtrosAtivos.categoria
            )
        }

        if (filtrosAtivos.preco === 'ate15') {
            produtosFiltrados = produtosFiltrados.filter((p) => p.preco <= 15)
        } else if (filtrosAtivos.preco === '15a30') {
            produtosFiltrados = produtosFiltrados.filter(
                (p) => p.preco > 15 && p.preco <= 30
            )
        } else if (filtrosAtivos.preco === 'mais30') {
            produtosFiltrados = produtosFiltrados.filter((p) => p.preco > 30)
        }

        renderizarProdutos(produtosFiltrados)
    }

    function mostrarDetalhesProduto(produto) {
        // Preencher os dados do modal
        document.getElementById('detalhe-nome').textContent = produto.nome
        document.getElementById('detalhe-categoria').textContent = produto.categoria.charAt(0).toUpperCase() + produto.categoria.slice(1)
        document.getElementById('detalhe-preco').textContent = `R$ ${produto.preco.toFixed(2)}`
        document.getElementById('detalhe-descricao').textContent = produto.descricao || 'Sem descrição disponível'
        
        // Armazenar o ID do produto no modal para futuras operações
        const modal = document.getElementById('modalDetalhesProduto')
        modal.dataset.produtoId = produto.id
        
        // TODO: Implementar quando os níveis de acesso estiverem prontos
        // const usuario = getUsuarioAtual()
        // if (usuario?.papel === 'admin') {
        //     document.getElementById('btn-editar-produto').classList.remove('d-none')
        //     document.getElementById('btn-remover-produto').classList.remove('d-none')
        // } else {
        //     document.getElementById('btn-editar-produto').classList.add('d-none')
        //     document.getElementById('btn-remover-produto').classList.add('d-none')
        // }
        
        // Abrir o modal
        const modalInstance = new bootstrap.Modal(modal)
        modalInstance.show()
    }

    function mostrarLoading(ativo) {
        if (loadingSpinner) {
            loadingSpinner.style.display = ativo ? 'block' : 'none'
        }
    }

    function mostrarErro(mensagem) {
        alert(mensagem) // futuramente trocar por um componente visual de erro
    }

    function formatarTituloCategoria(categoria) {
        return categoria.charAt(0).toUpperCase() + categoria.slice(1)
    }

    // TODO: Implementar quando os níveis de acesso estiverem prontos
    // Event listeners para os botões de editar e remover no modal de detalhes
    // 
    // document.getElementById('btn-editar-produto').addEventListener('click', () => {
    //     const produtoId = document.getElementById('modalDetalhesProduto').dataset.produtoId
    //     // Implementar lógica de edição
    //     console.log('Editar produto ID:', produtoId)
    // })
    // 
    // document.getElementById('btn-remover-produto').addEventListener('click', async () => {
    //     const produtoId = document.getElementById('modalDetalhesProduto').dataset.produtoId
    //     const confirmacao = confirm('Tem certeza que deseja remover este produto?')
    //     if (confirmacao) {
    //         try {
    //             // Fazer requisição DELETE para /api/cardapio/:id
    //             const response = await fetch(`${BASE_URL}/api/cardapio/${produtoId}`, {
    //                 method: 'DELETE',
    //                 headers: {
    //                     'Authorization': `Bearer ${localStorage.getItem('token')}`
    //                 }
    //             })
    //             if (response.ok) {
    //                 alert('Produto removido com sucesso!')
    //                 location.reload()
    //             } else {
    //                 throw new Error('Erro ao remover produto')
    //             }
    //         } catch (error) {
    //             alert('Erro ao remover produto: ' + error.message)
    //         }
    //     }
    // })
})
