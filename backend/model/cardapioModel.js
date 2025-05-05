import { supabase } from '../../supabase.js';

export class CardapioModel {
    // Fetch all menu items from the database
    static async fetchCardapio() {
        try {
            const { data, error } = await supabase
                .from('produtos')
                .select('*')
                .order('categoria, nome');

            if (error) {
                throw new Error(`Erro ao buscar cardápio: ${error.message}`);
            }

            return data.map(produto => ({
                id: produto.id,
                nome: produto.nome,
                categoria: produto.categoria,
                preco: produto.preco,
                descricao: produto.descricao,
                imagem: produto.imagem
            }));
        } catch (error) {
            throw error;
        }
    }
}