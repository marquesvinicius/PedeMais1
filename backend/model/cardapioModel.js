const { supabase } = require('../config/supabase')

class CardapioModel {
    // Fetch all menu items from the database
    static async fetchCardapio() {
        try {
            const { data, error } = await supabase
                .from('cardapio')
                .select('*')
                .order('categoria', { ascending: true });

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

module.exports = { CardapioModel }