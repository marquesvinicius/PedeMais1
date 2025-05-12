const { createPedido, buscarPedidos, atualizarStatusPedido } = require('../controller/pedidosController');
const { supabase } = require('../services/supabaseClient');

// Mock Supabase
jest.mock('../services/supabaseClient', () => ({
    supabase: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        // Adicione outros métodos do Supabase que podem ser usados
    }
}));

// Helper para mock de response
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('Testes Unitários - pedidosController', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        jest.clearAllMocks(); // Limpa todas as chamadas, instâncias e retornos mockados.
        mockRes = mockResponse(); // Cria uma nova instância limpa de mockRes para cada teste.
    });

    // Testes para Criação de Pedidos (createPedido)
    describe('createPedido', () => {
        beforeEach(() => {
            mockReq = {
                body: {},
                user: { id: 'testUserId' } 
            };
            // Limpeza adicional específica para mocks do supabase se necessário entre testes do mesmo describe
            // supabase.insert.mockClear();
            // supabase.select.mockClear(); 
        });

        test('Deve criar um novo pedido com sucesso (201)', async () => {
            mockReq.body = {
                mesa: 5,
                itens: [{ nome: 'Item A', preco: 10 }, { nome: 'Item B', preco: 20 }],
                observacoes: 'Teste obs'
            };
            const valorTotalEsperado = 30; // 10 + 20
            const pedidoCriadoMock = {
                id: 'pedidoIdGerado',
                mesa: mockReq.body.mesa,
                valor_total: valorTotalEsperado,
                status: 'pendente',
                observacoes: mockReq.body.observacoes,
                criado_por: mockReq.user.id
            };

            supabase.select.mockResolvedValueOnce({ data: [pedidoCriadoMock], error: null });

            await createPedido(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(201);
            expect(mockRes.json).toHaveBeenCalledWith({
                mensagem: 'Pedido registrado com sucesso.',
                pedido: pedidoCriadoMock
            });
            expect(supabase.from).toHaveBeenCalledWith('pedidos');
            expect(supabase.insert).toHaveBeenCalledWith([expect.objectContaining({
                mesa: mockReq.body.mesa,
                valor_total: valorTotalEsperado,
                status: 'pendente',
                observacoes: mockReq.body.observacoes,
                criado_por: mockReq.user.id
            })]);
            expect(supabase.select).toHaveBeenCalledTimes(1);
        });
        
        test('Deve retornar erro 400 se mesa ou itens não forem fornecidos ou itens não for array', async () => {
            const casosInvalidos = [
                { itens: [{ preco: 10 }] }, // Sem mesa
                { mesa: 1 },                 // Sem itens
                { mesa: 1, itens: 'não é array' } // itens não é array
            ];

            for (const payload of casosInvalidos) {
                mockReq.body = payload;
                // Limpar mocks para cada iteração
                supabase.insert.mockClear(); 
                supabase.select.mockClear();

                await createPedido(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({ erro: 'Mesa e itens são obrigatórios.' });
                expect(supabase.insert).not.toHaveBeenCalled();
            }
        });
        
        test('Deve retornar erro 400 se itens for um array vazio', async () => {
            mockReq.body = { mesa: 1, itens: [] };
            // Limpar mocks para esta chamada específica
            supabase.insert.mockClear(); 
            supabase.select.mockClear();

            await createPedido(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ erro: 'Mesa e itens são obrigatórios.' });
            expect(supabase.insert).not.toHaveBeenCalled();
        });
        
        test('Deve retornar erro 500 se a inserção no Supabase falhar', async () => {
            mockReq.body = {
                mesa: 7,
                itens: [{ nome: 'Produto X', preco: 50 }],
            };
            const dbError = { message: 'Erro simulado no banco de dados' };
            // O controller faz insert().select(). O erro é mockado no select.
            supabase.select.mockResolvedValueOnce({ data: null, error: dbError });

            await createPedido(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                erro: 'Erro ao registrar pedido.',
                detalhes: dbError.message
            });
            expect(supabase.insert).toHaveBeenCalledTimes(1); // Garante que a tentativa de insert ocorreu
        });
        
        test('Deve retornar 401 se req.user não estiver definido', async () => {
            const localMockReq = {
                body: { // Corpo válido para não cair em outra validação
                    mesa: 1,
                    itens: [{ nome: 'Item', preco: 10 }]
                },
                user: undefined // Simula falha na autenticação (middleware não populou req.user)
            };
            // Limpar mocks
            supabase.insert.mockClear();
            supabase.select.mockClear();

            await createPedido(localMockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ erro: 'Usuário não autenticado.' });
            expect(supabase.insert).not.toHaveBeenCalled();
        });
    });

    // Testes para Busca de Pedidos (buscarPedidos)
    describe('buscarPedidos', () => {
        beforeEach(() => {
            mockReq = {
                user: { id: 'testUserId' } // Simula usuário autenticado
            };
        });
        test('Deve buscar e retornar os pedidos do usuário (200)', async () => {
            const mockPedidos = [
                { id: 'pedido1', valor_total: 50, status: 'entregue', criado_por: 'testUserId' },
                { id: 'pedido2', valor_total: 75, status: 'pendente', criado_por: 'testUserId' },
            ];
            supabase.order.mockResolvedValueOnce({ data: mockPedidos, error: null });

            await buscarPedidos(mockReq, mockRes);

            expect(supabase.from).toHaveBeenCalledWith('pedidos');
            expect(supabase.select).toHaveBeenCalledWith('*');
            expect(supabase.eq).toHaveBeenCalledWith('criado_por', 'testUserId');
            expect(supabase.order).toHaveBeenCalledWith('criado_em', { ascending: false });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ pedidos: mockPedidos });
        });
        test('Deve retornar erro 500 se a busca no Supabase falhar', async () => {
            const dbError = { message: 'Falha ao buscar dados' };
            supabase.order.mockResolvedValueOnce({ data: null, error: dbError });

            await buscarPedidos(mockReq, mockRes);

            expect(supabase.from).toHaveBeenCalledWith('pedidos');
            expect(supabase.select).toHaveBeenCalledWith('*');
            expect(supabase.eq).toHaveBeenCalledWith('criado_por', 'testUserId');
            expect(supabase.order).toHaveBeenCalledWith('criado_em', { ascending: false });
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                erro: 'Erro ao buscar pedidos.',
                detalhes: dbError.message
            });
        });
        test('Deve retornar 401 se req.user não estiver definido', async () => {
            const localMockReq = {
                user: undefined // Simula falha na autenticação
            };
            // Limpar mocks do Supabase, pois não devem ser chamados
            supabase.from.mockClear();
            supabase.select.mockClear();
            supabase.eq.mockClear();
            supabase.order.mockClear();

            await buscarPedidos(localMockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ erro: 'Usuário não autenticado.' });
            expect(supabase.from).not.toHaveBeenCalled();
            expect(supabase.select).not.toHaveBeenCalled();
            expect(supabase.eq).not.toHaveBeenCalled();
            expect(supabase.order).not.toHaveBeenCalled();
        });
    });

    // Testes para Atualização de Status (atualizarStatusPedido)
    describe('atualizarStatusPedido', () => {
        let mockConsoleLog;
        let mockConsoleError;

        beforeEach(() => {
            mockReq = {
                params: {},
                body: {},
            };
            supabase.from.mockClear();
            supabase.update.mockClear();
            supabase.eq.mockClear();

            // Mock console
            mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
            mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
        });

        afterEach(() => {
            // Restore console
            mockConsoleLog.mockRestore();
            mockConsoleError.mockRestore();
        });

        test('Deve atualizar o status do pedido com sucesso (200)', async () => {
            mockReq.params.id = 'pedidoId123';
            mockReq.body.status = 'confirmado';

            supabase.eq.mockResolvedValueOnce({ error: null }); 

            await atualizarStatusPedido(mockReq, mockRes);

            expect(supabase.from).toHaveBeenCalledWith('pedidos');
            expect(supabase.update).toHaveBeenCalledWith({ status: 'confirmado' });
            expect(supabase.eq).toHaveBeenCalledWith('id', 'pedidoId123');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ mensagem: 'Status atualizado com sucesso.' });
        });

        test('Deve retornar erro 400 se ID do pedido ou status não forem fornecidos', async () => {
            const casosInvalidos = [
                { params: { id: 'ped1' }, body: {} }, // Sem status
                { params: {}, body: { status: 'novo' } }, // Sem ID
                { params: {}, body: {} } // Sem ambos
            ];

            for (const caso of casosInvalidos) {
                mockReq.params = caso.params;
                mockReq.body = caso.body;
                // Limpar chamadas anteriores dentro do loop
                supabase.update.mockClear(); 
                supabase.eq.mockClear();
                mockRes.status.mockClear();
                mockRes.json.mockClear();

                await atualizarStatusPedido(mockReq, mockRes);

                expect(mockRes.status).toHaveBeenCalledWith(400);
                expect(mockRes.json).toHaveBeenCalledWith({ erro: 'ID e status são obrigatórios.' });
                expect(supabase.update).not.toHaveBeenCalled();
            }
        });

        test('Deve retornar erro 500 se a atualização no Supabase falhar', async () => {
            mockReq.params.id = 'pedidoId456'; // ID válido
            mockReq.body.status = 'preparando'; // Status válido
            
            const dbError = { message: 'Erro simulado ao atualizar' };
            supabase.eq.mockResolvedValueOnce({ error: dbError });

            await atualizarStatusPedido(mockReq, mockRes);

            expect(supabase.from).toHaveBeenCalledWith('pedidos');
            expect(supabase.update).toHaveBeenCalledWith({ status: 'preparando' });
            expect(supabase.eq).toHaveBeenCalledWith('id', 'pedidoId456');
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                erro: 'Erro ao atualizar status.', // Mensagem correta do controller
                detalhes: dbError.message
            });
        });

        test('Deve retornar 200 (sucesso) mesmo se ID do pedido não existir no DB', async () => {
            mockReq.params.id = 'idInexistente999';
            mockReq.body.status = 'cancelado';

            // Supabase update().eq() não retorna erro se o ID não for encontrado, apenas não atualiza nada.
            // O controller atual não verifica se algo foi de fato atualizado.
            supabase.eq.mockResolvedValueOnce({ error: null }); 

            await atualizarStatusPedido(mockReq, mockRes);

            expect(supabase.from).toHaveBeenCalledWith('pedidos');
            expect(supabase.update).toHaveBeenCalledWith({ status: 'cancelado' });
            expect(supabase.eq).toHaveBeenCalledWith('id', 'idInexistente999');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ mensagem: 'Status atualizado com sucesso.' });
        });

        test('Usuário comum DEVE conseguir atualizar status do pedido (200)', async () => {
            mockReq.params.id = 'pedidoId789';
            mockReq.body.status = 'a caminho';
            mockReq.user = { id: 'regularUserId', papel: 'user' }; // Simula usuário comum autenticado

            supabase.eq.mockResolvedValueOnce({ error: null });

            await atualizarStatusPedido(mockReq, mockRes);

            expect(supabase.from).toHaveBeenCalledWith('pedidos');
            expect(supabase.update).toHaveBeenCalledWith({ status: 'a caminho' });
            expect(supabase.eq).toHaveBeenCalledWith('id', 'pedidoId789');
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({ mensagem: 'Status atualizado com sucesso.' });
        });
    });
}); 