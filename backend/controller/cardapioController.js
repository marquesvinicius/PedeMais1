const { supabase } = require('../services/supabaseClient');

const buscarCardapio = async (req, res) => {
    const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .order('categoria, nome');

    if (error) {
        return res.status(500).json({ erro: 'Erro ao buscar cardápio.', detalhes: error.message });
    }

    res.status(200).json(data);
};

const adicionarProduto = async (req, res) => {
    const { nome, descricao, preco, categoria } = req.body;
    const papel = req.user?.papel;

    if (papel !== 'admin') {
        return res.status(403).json({ erro: 'Apenas administradores podem adicionar produtos.' });
    }

    if (!nome || !preco || !categoria) {
        return res.status(400).json({ erro: 'Nome, preço e categoria são obrigatórios.' });
    }
    const { data, error } = await supabase
        .from('produtos')
        .insert([{ nome, descricao, preco, categoria }]) // Removi imagem, já que não existe
        .select(); // <- ESSA LINHA FAZ TUDO FUNCIONAR

    if (error) {
        return res.status(500).json({ erro: 'Erro ao adicionar produto.', detalhes: error.message });
    }

    res.status(201).json({ mensagem: 'Produto adicionado com sucesso.', produto: data[0] });
};

module.exports = {
    buscarCardapio,
    adicionarProduto
};
