import { supabase } from '../../../supabase.js'

export async function limparCardapio() {
    try {
        const { error } = await supabase
            .from('cardapio')
            .delete()
            .neq('id', 0) // Isso garante que todos os registros sejam deletados

        if (error) throw error

        // Resetar a sequência
        const { error: resetError } = await supabase.rpc('reset_sequence', {
            table_name: 'cardapio',
            sequence_name: 'cardapio_id_seq'
        })

        if (resetError) throw resetError

        return { success: true }
    } catch (error) {
        console.error('Erro ao limpar cardápio:', error)
        throw error
    }
}