const { supabase } = require('../services/supabaseClient');

const createPedido = async (req, res) => {
  const { mesa, itens, observacoes } = req.body;
  const usuarioId = req.user?.id;

  if (!mesa || !Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'Mesa e itens são obrigatórios.' });
  }

  if (!usuarioId) {
    return res.status(401).json({ erro: 'Usuário não autenticado.' });
  }

  const valor_total = itens.reduce((acc, item) => acc + (item.preco || 0), 0);

  const { data, error } = await supabase
    .from('pedidos')
    .insert([{
      mesa,
      status: 'pendente',
      valor_total,
      observacoes: observacoes || null,
      criado_por: usuarioId
    }])
    .select();

  if (error) {
    return res.status(500).json({ erro: 'Erro ao registrar pedido.', detalhes: error.message });
  }

  res.status(201).json({ mensagem: 'Pedido registrado com sucesso.', pedido: data[0] });
};

// Buscar todos os pedidos do usuário autenticado
const buscarPedidos = async (req, res) => {
  const usuarioId = req.user?.id;

  if (!usuarioId) {
    return res.status(401).json({ erro: 'Usuário não autenticado.' });
  }

  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('criado_por', usuarioId)
    .order('criado_em', { ascending: false });

  if (error) {
    return res.status(500).json({ erro: 'Erro ao buscar pedidos.', detalhes: error.message });
  }

  res.status(200).json({ pedidos: data });
};

const atualizarStatusPedido = async (req, res) => {
  const { id } = req.params
  const { status } = req.body

  if (!id || !status) {
    return res.status(400).json({ erro: 'ID e status são obrigatórios.' })
  }

  console.log('Alterando pedido ID:', id, 'para status:', status)

  const { error } = await supabase
    .from('pedidos')
    .update({ status })
    .eq('id', id)

  if (error) {
    console.error('Erro ao atualizar status:', error.message)
    return res.status(500).json({ erro: 'Erro ao atualizar status.', detalhes: error.message })
  }

  res.status(200).json({ mensagem: 'Status atualizado com sucesso.' })
}




module.exports = {
  createPedido,
  buscarPedidos,
  atualizarStatusPedido
};
