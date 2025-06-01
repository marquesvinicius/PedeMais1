// view/scripts/api/apiProdutos.js
import { supabase, waitForSupabase } from '../../../supabase.js'

export async function buscarCardapio() {
    // Aguardar o Supabase estar disponível
    const client = supabase || await waitForSupabase()
    
    if (!client) {
        throw new Error('Supabase não está disponível')
    }
    
    const { data, error } = await client
        .from('produtos')
        .select('*')
        .order('categoria, nome')

    if (error) {
        throw new Error(`Erro ao buscar cardápio: ${error.message}`)
    }

    return data.map(produto => ({
        id: produto.id,
        nome: produto.nome,
        categoria: produto.categoria,
        preco: produto.preco,
        descricao: produto.descricao,
    }))
}
