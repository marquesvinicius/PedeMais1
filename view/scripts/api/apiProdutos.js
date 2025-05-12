// view/scripts/api/apiCardapio.js
import { supabase } from '../../../supabase.js'

export async function buscarCardapio() {
    try {
        const { data, error } = await supabase
            .from('cardapio')
            .select('*')
            .order('categoria', { ascending: true })

        if (error) throw error
        return data
    } catch (error) {
        console.error('Erro ao buscar cardápio:', error)
        throw error
    }
}

export async function adicionarItem(item) {
    try {
        const { data, error } = await supabase
            .from('cardapio')
            .insert([item])
            .select()

        if (error) throw error
        return data[0]
    } catch (error) {
        console.error('Erro ao adicionar item:', error)
        throw error
    }
}

export async function atualizarItem(id, item) {
    try {
        const { data, error } = await supabase
            .from('cardapio')
            .update(item)
            .eq('id', id)
            .select()

        if (error) throw error
        return data[0]
    } catch (error) {
        console.error('Erro ao atualizar item:', error)
        throw error
    }
}

export async function removerItem(id) {
    try {
        const { error } = await supabase
            .from('cardapio')
            .delete()
            .eq('id', id)

        if (error) throw error
        return true
    } catch (error) {
        console.error('Erro ao remover item:', error)
        throw error
    }
}
