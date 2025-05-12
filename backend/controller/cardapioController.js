const { supabase } = require('../config/supabase');

const buscarCardapio = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('cardapio')
            .select('*')
            .order('categoria', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar cardápio:', error);
        res.status(500).json({ erro: 'Erro ao buscar cardápio' });
    }
};

const adicionarItem = async (req, res) => {
    try {
        // Verificar se é admin
        if (!req.usuario?.isAdmin) {
            return res.status(403).json({ erro: 'Apenas administradores podem adicionar itens.' });
        }

        const { data, error } = await supabase
            .from('cardapio')
            .insert([req.body])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Erro ao adicionar item:', error);
        res.status(500).json({ erro: 'Erro ao adicionar item' });
    }
};

module.exports = {
    buscarCardapio,
    adicionarItem
};
