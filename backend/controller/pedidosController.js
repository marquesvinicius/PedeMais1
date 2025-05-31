const { supabase } = require('../services/supabaseClient');

const createPedido = async (req, res) => {
  const { mesa, itens, observacoes } = req.body;
  const usuarioId = req.user?.id;

  console.log('🚀 [createPedido] Iniciando criação de pedido no backend');
  console.log('📥 [createPedido] Dados recebidos:', { mesa, itens, observacoes, usuarioId });

  if (!mesa || !Array.isArray(itens) || itens.length === 0) {
    console.error('❌ [createPedido] Validação falhou - mesa ou itens inválidos');
    return res.status(400).json({ erro: 'Mesa e itens são obrigatórios.' });
  }

  if (!usuarioId) {
    console.error('❌ [createPedido] Usuário não autenticado');
    return res.status(401).json({ erro: 'Usuário não autenticado.' });
  }

  const valor_total = itens.reduce((acc, item) => acc + (item.preco || 0), 0);
  console.log('💰 [createPedido] Valor total calculado:', valor_total);

  console.log('✅ [createPedido] Validações passaram, criando pedido...');

  try {
    // 1. Criar o pedido principal
    console.log('📝 [createPedido] Inserindo pedido principal na tabela pedidos...');
    const { data: pedidoData, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([{
        mesa,
        status: 'pendente',
        valor_total,
        observacoes: observacoes || null,
        criado_por: usuarioId
      }])
      .select()
      .single();

    if (pedidoError) {
      console.error('❌ [createPedido] Erro ao criar pedido principal:', pedidoError);
      throw pedidoError;
    }

    console.log('✅ [createPedido] Pedido principal criado com sucesso:', pedidoData);

    // 2. Inserir itens individuais na tabela itens_pedido
    const itensParaInserir = itens.map(item => ({
      pedido_id: pedidoData.id,
      item_cardapio_id: item.item_cardapio_id || null, // Se vier do cardápio
      quantidade: item.quantidade || 1,
      preco_unitario: item.preco || 0
    }));

    console.log('📦 [createPedido] Itens para inserir na tabela itens_pedido:', itensParaInserir);
    console.log('🔢 [createPedido] Quantidade de itens a inserir:', itensParaInserir.length);

    const { data: itensInseridos, error: itensError } = await supabase
      .from('itens_pedido')
      .insert(itensParaInserir)
      .select();

    if (itensError) {
      console.error('❌ [createPedido] Erro ao inserir itens na tabela itens_pedido:', itensError);
      console.log('🔄 [createPedido] Revertendo pedido principal...');
      // Se falhar ao inserir itens, reverter o pedido
      await supabase.from('pedidos').delete().eq('id', pedidoData.id);
      throw itensError;
    }

    console.log('✅ [createPedido] Itens inseridos com sucesso:', itensInseridos);
    console.log('🔢 [createPedido] Quantidade de itens inseridos:', itensInseridos?.length || 0);

    const resposta = { 
      mensagem: 'Pedido registrado com sucesso.', 
      pedido: pedidoData,
      itens_inseridos: itensInseridos?.length || 0
    };

    console.log('📤 [createPedido] Enviando resposta:', resposta);
    res.status(201).json(resposta);

  } catch (error) {
    console.error('💥 [createPedido] Erro geral ao criar pedido:', error);
    return res.status(500).json({ 
      erro: 'Erro ao registrar pedido.', 
      detalhes: error.message 
    });
  }
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

// Buscar pedido específico por ID
const buscarPedidoPorId = async (req, res) => {
  const { id } = req.params;
  const usuarioId = req.user?.id;

  if (!usuarioId) {
    return res.status(401).json({ erro: 'Usuário não autenticado.' });
  }

  if (!id) {
    return res.status(400).json({ erro: 'ID do pedido é obrigatório.' });
  }

  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .eq('criado_por', usuarioId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ erro: 'Pedido não encontrado.' });
      }
      return res.status(500).json({ erro: 'Erro ao buscar pedido.', detalhes: error.message });
    }

    res.status(200).json({ pedido: data });
  } catch (error) {
    console.error('Erro ao buscar pedido por ID:', error);
    return res.status(500).json({ 
      erro: 'Erro ao buscar pedido.', 
      detalhes: error.message 
    });
  }
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
  buscarPedidoPorId,
  atualizarStatusPedido
};
