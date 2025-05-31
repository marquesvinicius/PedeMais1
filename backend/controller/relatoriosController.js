const { supabase } = require('../services/supabaseClient');

// Relatório geral de pedidos por período
const relatorioGeral = async (req, res) => {
    try {
        const { dataInicial, dataFinal } = req.query;
        const usuarioId = req.user?.id;

        if (!usuarioId) {
            return res.status(401).json({ erro: 'Usuário não autenticado.' });
        }

        let query = supabase
            .from('pedidos')
            .select('*')
            .eq('criado_por', usuarioId)
            .order('criado_em', { ascending: false });

        // Aplicar filtros de data se fornecidos
        if (dataInicial) {
            query = query.gte('criado_em', dataInicial);
        }
        if (dataFinal) {
            // Adicionar 23:59:59 para incluir todo o dia final
            const dataFinalCompleta = new Date(dataFinal);
            dataFinalCompleta.setHours(23, 59, 59, 999);
            query = query.lte('criado_em', dataFinalCompleta.toISOString());
        }

        const { data, error } = await query;

        if (error) {
            return res.status(500).json({ erro: 'Erro ao buscar relatório.', detalhes: error.message });
        }

        res.status(200).json({ pedidos: data });
    } catch (err) {
        console.error('Erro no relatório geral:', err);
        res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
};

// Relatório de vendas por período (resumo)
const relatorioVendas = async (req, res) => {
    try {
        const { dataInicial, dataFinal } = req.query;
        const usuarioId = req.user?.id;

        if (!usuarioId) {
            return res.status(401).json({ erro: 'Usuário não autenticado.' });
        }

        let query = supabase
            .from('pedidos')
            .select('valor_total, status, criado_em')
            .eq('criado_por', usuarioId);

        // Aplicar filtros de data
        if (dataInicial) {
            query = query.gte('criado_em', dataInicial);
        }
        if (dataFinal) {
            const dataFinalCompleta = new Date(dataFinal);
            dataFinalCompleta.setHours(23, 59, 59, 999);
            query = query.lte('criado_em', dataFinalCompleta.toISOString());
        }

        const { data, error } = await query;

        if (error) {
            return res.status(500).json({ erro: 'Erro ao buscar relatório de vendas.', detalhes: error.message });
        }

        // Calcular estatísticas
        const totalPedidos = data.length;
        const totalVendas = data.reduce((acc, pedido) => acc + (pedido.valor_total || 0), 0);
        const pedidosPorStatus = data.reduce((acc, pedido) => {
            acc[pedido.status] = (acc[pedido.status] || 0) + 1;
            return acc;
        }, {});

        const ticketMedio = totalPedidos > 0 ? totalVendas / totalPedidos : 0;

        res.status(200).json({
            resumo: {
                totalPedidos,
                totalVendas: parseFloat(totalVendas.toFixed(2)),
                ticketMedio: parseFloat(ticketMedio.toFixed(2)),
                pedidosPorStatus
            },
            periodo: {
                dataInicial: dataInicial || 'Início',
                dataFinal: dataFinal || 'Hoje'
            }
        });
    } catch (err) {
        console.error('Erro no relatório de vendas:', err);
        res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
};

// Relatório de pedidos por mesa
const relatorioPorMesa = async (req, res) => {
    try {
        const { dataInicial, dataFinal } = req.query;
        const usuarioId = req.user?.id;

        if (!usuarioId) {
            return res.status(401).json({ erro: 'Usuário não autenticado.' });
        }

        let query = supabase
            .from('pedidos')
            .select('mesa, valor_total, status, criado_em')
            .eq('criado_por', usuarioId);

        // Aplicar filtros de data
        if (dataInicial) {
            query = query.gte('criado_em', dataInicial);
        }
        if (dataFinal) {
            const dataFinalCompleta = new Date(dataFinal);
            dataFinalCompleta.setHours(23, 59, 59, 999);
            query = query.lte('criado_em', dataFinalCompleta.toISOString());
        }

        const { data, error } = await query;

        if (error) {
            return res.status(500).json({ erro: 'Erro ao buscar relatório por mesa.', detalhes: error.message });
        }

        // Agrupar por mesa
        const relatorioPorMesa = data.reduce((acc, pedido) => {
            const mesa = pedido.mesa;
            if (!acc[mesa]) {
                acc[mesa] = {
                    mesa,
                    totalPedidos: 0,
                    totalVendas: 0,
                    pedidosPorStatus: {}
                };
            }
            
            acc[mesa].totalPedidos++;
            acc[mesa].totalVendas += pedido.valor_total || 0;
            acc[mesa].pedidosPorStatus[pedido.status] = (acc[mesa].pedidosPorStatus[pedido.status] || 0) + 1;
            
            return acc;
        }, {});

        // Converter para array e ordenar por mesa
        const resultado = Object.values(relatorioPorMesa)
            .sort((a, b) => a.mesa - b.mesa)
            .map(item => ({
                ...item,
                totalVendas: parseFloat(item.totalVendas.toFixed(2))
            }));

        res.status(200).json({ relatorio: resultado });
    } catch (err) {
        console.error('Erro no relatório por mesa:', err);
        res.status(500).json({ erro: 'Erro interno do servidor.' });
    }
};

module.exports = {
    relatorioGeral,
    relatorioVendas,
    relatorioPorMesa
}; 