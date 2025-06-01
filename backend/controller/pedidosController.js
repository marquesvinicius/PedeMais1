const { supabase } = require('../services/supabaseClient');

const createPedido = async (req, res) => {
  const { mesa, itens, observacoes } = req.body;
  const usuarioId = req.user?.id;

  console.log('🚀 [createPedido] Iniciando criação de pedido no backend');
  console.log('📥 [createPedido] Dados recebidos:', { mesa, itens, observacoes, usuarioId });
  console.log('📥 [createPedido] Tipo de itens:', typeof itens, 'É array:', Array.isArray(itens));
  console.log('📥 [createPedido] Itens detalhados:', JSON.stringify(itens, null, 2));

  if (!mesa || !Array.isArray(itens) || itens.length === 0) {
    console.error('❌ [createPedido] Validação falhou - mesa ou itens inválidos');
    console.error('❌ [createPedido] Mesa:', mesa, 'Itens:', itens, 'É array:', Array.isArray(itens), 'Length:', itens?.length);
    return res.status(400).json({ erro: 'Mesa e itens são obrigatórios.' });
  }

  if (!usuarioId) {
    console.error('❌ [createPedido] Usuário não autenticado');
    return res.status(401).json({ erro: 'Usuário não autenticado.' });
  }

  const valor_total = itens.reduce((acc, item) => acc + (item.preco * (item.quantidade || 1) || 0), 0);
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
    console.log('📦 [createPedido] Preparando itens para inserção...');
    console.log('📦 [createPedido] Itens recebidos:', itens);
    
    const itensParaInserir = itens.map((item, index) => {
      console.log(`📦 [createPedido] Processando item ${index + 1}:`, item);
      
      const itemProcessado = {
        pedido_id: pedidoData.id,
        item_cardapio_id: item.item_cardapio_id || item.id || null,
        quantidade: item.quantidade || 1,
        preco_unitario: item.preco || 0
      };
      
      console.log(`📦 [createPedido] Item ${index + 1} processado:`, itemProcessado);
      return itemProcessado;
    });

    console.log('📦 [createPedido] Itens para inserir na tabela itens_pedido:', itensParaInserir);
    console.log('🔢 [createPedido] Quantidade de itens a inserir:', itensParaInserir.length);

    // Validar se todos os itens têm dados válidos
    const itensInvalidos = itensParaInserir.filter(item => 
      !item.pedido_id || 
      item.quantidade <= 0 || 
      item.preco_unitario <= 0
    );

    if (itensInvalidos.length > 0) {
      console.error('❌ [createPedido] Itens inválidos encontrados:', itensInvalidos);
      // Reverter pedido se houver itens inválidos
      await supabase.from('pedidos').delete().eq('id', pedidoData.id);
      return res.status(400).json({ 
        erro: 'Itens inválidos encontrados', 
        itens_invalidos: itensInvalidos 
      });
    }

    if (itensParaInserir.length > 0) {
      console.log('📤 [createPedido] Executando inserção na tabela itens_pedido...');
      
      const { data: itensInseridos, error: itensError } = await supabase
        .from('itens_pedido')
        .insert(itensParaInserir)
        .select();

      if (itensError) {
        console.error('❌ [createPedido] Erro ao inserir itens na tabela itens_pedido:', itensError);
        console.error('❌ [createPedido] Detalhes do erro:', JSON.stringify(itensError, null, 2));
        console.log('🔄 [createPedido] Revertendo pedido principal...');
        
        // Se falhar ao inserir itens, reverter o pedido
        await supabase.from('pedidos').delete().eq('id', pedidoData.id);
        
        return res.status(500).json({ 
          erro: 'Erro ao inserir itens do pedido', 
          detalhes: itensError.message,
          itens_tentativa: itensParaInserir
        });
      }

      console.log('✅ [createPedido] Itens inseridos com sucesso:', itensInseridos);
      console.log('🔢 [createPedido] Quantidade de itens inseridos:', itensInseridos?.length || 0);
      
      // Verificar se todos os itens foram inseridos
      if (itensInseridos.length !== itensParaInserir.length) {
        console.warn('⚠️ [createPedido] Nem todos os itens foram inseridos!');
        console.warn('⚠️ [createPedido] Esperado:', itensParaInserir.length, 'Inserido:', itensInseridos.length);
      }
    } else {
      console.warn('⚠️ [createPedido] Nenhum item para inserir!');
    }

    const resposta = { 
      mensagem: 'Pedido registrado com sucesso.', 
      pedido: pedidoData,
      itens_inseridos: itensParaInserir.length,
      debug: {
        itens_recebidos: itens.length,
        itens_processados: itensParaInserir.length,
        valor_total: valor_total
      }
    };

    console.log('📤 [createPedido] Enviando resposta:', resposta);
    res.status(201).json(resposta);

  } catch (error) {
    console.error('💥 [createPedido] Erro geral ao criar pedido:', error);
    console.error('💥 [createPedido] Stack trace:', error.stack);
    return res.status(500).json({ 
      erro: 'Erro ao registrar pedido.', 
      detalhes: error.message,
      stack: error.stack
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
  const usuarioId = req.user?.id

  console.log('🔄 [atualizarStatusPedido] Iniciando atualização de status')
  console.log('📥 [atualizarStatusPedido] Dados recebidos:', { id, status, usuarioId })

  if (!id || !status) {
    console.error('❌ [atualizarStatusPedido] Validação falhou - ID ou status ausentes')
    return res.status(400).json({ erro: 'ID e status são obrigatórios.' })
  }

  if (!usuarioId) {
    console.error('❌ [atualizarStatusPedido] Usuário não autenticado')
    return res.status(401).json({ erro: 'Usuário não autenticado.' })
  }

  // Validar status permitidos
  const statusPermitidos = ['pendente', 'em preparo', 'pronto', 'entregue', 'cancelado']
  if (!statusPermitidos.includes(status.toLowerCase())) {
    console.error('❌ [atualizarStatusPedido] Status inválido:', status)
    return res.status(400).json({ 
      erro: 'Status inválido.', 
      statusPermitidos: statusPermitidos 
    })
  }

  try {
    console.log('🔍 [atualizarStatusPedido] Verificando se pedido existe e pertence ao usuário...')
    
    // Primeiro verificar se o pedido existe e pertence ao usuário
    const { data: pedidoExistente, error: pedidoError } = await supabase
      .from('pedidos')
      .select('id, status, criado_por')
      .eq('id', id)
      .single()

    if (pedidoError) {
      console.error('❌ [atualizarStatusPedido] Erro ao buscar pedido:', pedidoError)
      if (pedidoError.code === 'PGRST116') {
        return res.status(404).json({ erro: 'Pedido não encontrado.' })
      }
      return res.status(500).json({ 
        erro: 'Erro ao verificar pedido.', 
        detalhes: pedidoError.message 
      })
    }

    console.log('📋 [atualizarStatusPedido] Pedido encontrado:', pedidoExistente)

    // Verificar se o usuário tem permissão (criador do pedido ou admin)
    if (pedidoExistente.criado_por !== usuarioId && req.user?.papel !== 'admin') {
      console.error('❌ [atualizarStatusPedido] Usuário sem permissão')
      return res.status(403).json({ erro: 'Sem permissão para alterar este pedido.' })
    }

    // Verificar se o status já não é o mesmo
    if (pedidoExistente.status === status) {
      console.log('⚠️ [atualizarStatusPedido] Status já é o mesmo, mas continuando...')
    }

    console.log('🔄 [atualizarStatusPedido] Atualizando status no banco...')
    
    // Atualizar o status
    const { data: pedidoAtualizado, error: updateError } = await supabase
      .from('pedidos')
      .update({ 
        status: status,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ [atualizarStatusPedido] Erro ao atualizar status:', updateError)
      return res.status(500).json({ 
        erro: 'Erro ao atualizar status.', 
        detalhes: updateError.message 
      })
    }

    console.log('✅ [atualizarStatusPedido] Status atualizado com sucesso:', pedidoAtualizado)

    // Registrar no log de status (se a tabela existir)
    try {
      await supabase
        .from('pedidos_status_log')
        .insert([{
          pedido_id: id,
          status: status,
          alterado_por: usuarioId,
          alterado_em: new Date().toISOString()
        }])
    } catch (logError) {
      console.warn('⚠️ [atualizarStatusPedido] Erro ao registrar log (não crítico):', logError)
    }

    res.status(200).json({ 
      mensagem: 'Status atualizado com sucesso.',
      pedido: pedidoAtualizado
    })

  } catch (error) {
    console.error('💥 [atualizarStatusPedido] Erro geral:', error)
    console.error('💥 [atualizarStatusPedido] Stack trace:', error.stack)
    return res.status(500).json({ 
      erro: 'Erro interno do servidor.', 
      detalhes: error.message 
    })
  }
}

module.exports = {
  createPedido,
  buscarPedidos,
  buscarPedidoPorId,
  atualizarStatusPedido
};
