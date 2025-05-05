import { supabase } from '../../supabase.js';

export class PedidosModel {
    // Fetch all orders from the database
    static async fetchPedidos() {
        try {
            const { data, error } = await supabase
                .from('pedidos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw new Error(`Erro ao buscar pedidos: ${error.message}`);
            }

            return data.map(pedido => ({
                id: pedido.id,
                mesa: pedido.mesa,
                status: pedido.status,
                itens: pedido.itens,
                created_at: pedido.created_at
            }));
        } catch (error) {
            throw error;
        }
    }

    // Filter orders by status
    static async filterByStatus(pedidos, status) {
        if (status === 'todos') return pedidos;
        return pedidos.filter(pedido => pedido.status.toLowerCase() === status.toLowerCase());
    }

    // Filter orders by table (mesa)
    static async filterByMesa(pedidos, mesa) {
        if (mesa === 'todas' || !mesa) return pedidos;
        return pedidos.filter(pedido => pedido.mesa === parseInt(mesa));
    }

    // Update the status of an order
    static async updateStatus(id, newStatus) {
        try {
            const { error } = await supabase
                .from('pedidos')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) {
                throw new Error(`Erro ao atualizar status: ${error.message}`);
            }

            return true;
        } catch (error) {
            throw error;
        }
    }
}