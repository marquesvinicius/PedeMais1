// view/scripts/api/apiProdutos.js
import { supabase, waitForSupabase } from '../../../supabase.js'

export async function buscarCardapio() {
    // Aguardar o Supabase estar disponível
    const client = supabase || await waitForSupabase()
    
    if (!client) {
        throw new Error('Supabase não está disponível')
    }
    
    // Tentar buscar produtos ativos primeiro, se a coluna 'ativo' existir
    // Se não existir, buscar todos os produtos
    let query = client
        .from('produtos')
        .select('*')
        .order('categoria, nome')
    
    try {
        // Tentar filtrar por produtos ativos
        const { data, error } = await query.eq('ativo', true)
        
        if (error) {
            // Se der erro (coluna não existe), buscar todos os produtos
            if (error.message.includes('column "ativo" does not exist')) {
                console.log('Coluna "ativo" não existe, buscando todos os produtos')
                const { data: allData, error: allError } = await client
                    .from('produtos')
                    .select('*')
                    .order('categoria, nome')
                
                if (allError) {
                    throw new Error(`Erro ao buscar cardápio: ${allError.message}`)
                }
                
                return allData.map(produto => ({
                    id: produto.id,
                    nome: produto.nome,
                    categoria: produto.categoria,
                    preco: produto.preco,
                    descricao: produto.descricao,
                }))
            } else {
                throw new Error(`Erro ao buscar cardápio: ${error.message}`)
            }
        }

        return data.map(produto => ({
            id: produto.id,
            nome: produto.nome,
            categoria: produto.categoria,
            preco: produto.preco,
            descricao: produto.descricao,
        }))
        
    } catch (err) {
        // Fallback: buscar todos os produtos se algo der errado
        console.log('Erro ao filtrar por produtos ativos, buscando todos:', err.message)
        const { data: allData, error: allError } = await client
            .from('produtos')
            .select('*')
            .order('categoria, nome')
        
        if (allError) {
            throw new Error(`Erro ao buscar cardápio: ${allError.message}`)
        }
        
        return allData.map(produto => ({
            id: produto.id,
            nome: produto.nome,
            categoria: produto.categoria,
            preco: produto.preco,
            descricao: produto.descricao,
        }))
    }
}

export async function verificarProdutoEmUso(produtoId) {
    // Aguardar o Supabase estar disponível
    const client = supabase || await waitForSupabase()
    
    if (!client) {
        throw new Error('Supabase não está disponível')
    }
    
    // Verificar se o produto está sendo usado em algum pedido
    const { data, error } = await client
        .from('itens_pedido')
        .select('id')
        .eq('item_cardapio_id', produtoId)
        .limit(1)

    if (error) {
        throw new Error(`Erro ao verificar uso do produto: ${error.message}`)
    }

    return data.length > 0
}

export async function deletarProduto(produtoId) {
    // Aguardar o Supabase estar disponível
    const client = supabase || await waitForSupabase()
    
    if (!client) {
        throw new Error('Supabase não está disponível')
    }
    
    // Primeiro, verificar se o produto está sendo usado em pedidos
    const produtoEmUso = await verificarProdutoEmUso(produtoId)
    
    if (produtoEmUso) {
        throw new Error('Este produto não pode ser deletado pois já foi usado em pedidos. Se necessário, você pode desativá-lo para que não apareça mais no cardápio.')
    }
    
    // Se não está em uso, pode deletar normalmente
    const { data, error } = await client
        .from('produtos')
        .delete()
        .eq('id', produtoId)

    if (error) {
        throw new Error(`Erro ao deletar produto: ${error.message}`)
    }

    return data
}

export async function desativarProduto(produtoId) {
    // Aguardar o Supabase estar disponível
    const client = supabase || await waitForSupabase()
    
    if (!client) {
        throw new Error('Supabase não está disponível')
    }
    
    // Implementar soft delete - marcar como inativo
    // Nota: Isso requer uma coluna 'ativo' na tabela produtos
    const { data, error } = await client
        .from('produtos')
        .update({ ativo: false })
        .eq('id', produtoId)

    if (error) {
        throw new Error(`Erro ao desativar produto: ${error.message}`)
    }

    return data
}
