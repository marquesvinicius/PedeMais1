const express = require('express');
const router = express.Router();
const { autenticar } = require('../middlewares/authMiddleware');
const pedidosController = require('../controller/pedidosController');

// Função para buscar itens de um pedido
async function buscarItensPedido(req, res) {
  const { id } = req.params;
  const usuarioId = req.user?.id;

  if (!usuarioId) {
    return res.status(401).json({ erro: 'Usuário não autenticado.' });
  }

  if (!id) {
    return res.status(400).json({ erro: 'ID do pedido é obrigatório.' });
  }

  try {
    const { supabase } = require('../services/supabaseClient');
    
    // Verificar se o pedido pertence ao usuário
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('id')
      .eq('id', id)
      .eq('criado_por', usuarioId)
      .single();

    if (pedidoError || !pedido) {
      return res.status(404).json({ erro: 'Pedido não encontrado.' });
    }

    // Buscar itens do pedido com join na tabela produtos
    const { data: itens, error: itensError } = await supabase
      .from('itens_pedido')
      .select(`
        *,
        produtos:item_cardapio_id (
          nome,
          preco
        )
      `)
      .eq('pedido_id', id);

    if (itensError) {
      console.error('Erro ao buscar itens:', itensError);
      return res.status(500).json({ erro: 'Erro ao buscar itens do pedido.' });
    }

    // Transformar dados para formato esperado
    const itensFormatados = itens.map(item => ({
      nome: item.produtos?.nome || `Item ${item.item_cardapio_id}`,
      preco: item.preco_unitario,
      quantidade: item.quantidade
    }));

    res.status(200).json({ itens: itensFormatados });

  } catch (error) {
    console.error('Erro ao buscar itens do pedido:', error);
    return res.status(500).json({ 
      erro: 'Erro ao buscar itens do pedido.', 
      detalhes: error.message 
    });
  }
}

// Rotas
router.get('/', autenticar, pedidosController.buscarPedidos);
router.get('/:id', autenticar, pedidosController.buscarPedidoPorId);
router.get('/:id/itens', autenticar, buscarItensPedido);
router.post('/', autenticar, pedidosController.createPedido);
router.patch('/:id', autenticar, pedidosController.atualizarStatusPedido);

module.exports = router;
