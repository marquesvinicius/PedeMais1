const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');
const { supabase } = require('../services/supabaseClient');

// Mock Supabase
jest.mock('../services/supabaseClient', () => ({
    supabase: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn(),
        // Adicione outros métodos do Supabase que podem ser usados nos fluxos
    }
}));

// Mock jsonwebtoken (apenas para jwt.sign, verify será testado pelo middleware real)
jest.mock('jsonwebtoken', () => ({
    ...jest.requireActual('jsonwebtoken'), // Mantém a implementação original de verify
    sign: jest.fn(), // Mockamos apenas o sign para gerar tokens de teste
})); 

// Helper para gerar tokens de teste
const generateTestToken = (payload) => {
    // Usamos o jwt.sign mockado para previsibilidade nos testes
    const mockToken = `mockTokenFor_${payload.id}_${payload.papel}`;
    jwt.sign.mockReturnValueOnce(mockToken); 
    // Chamada real para que o mock possa registrar a chamada, mesmo que o retorno seja fixo
    return require('jsonwebtoken').sign(payload, 'test-secret'); 
};

describe('Testes de Integração', () => {
    let regularUserToken;
    let adminUserToken;

    beforeAll(() => {
        process.env.JWT_SECRET = 'test-secret-for-integration';
        const actualJwt = jest.requireActual('jsonwebtoken');
        regularUserToken = actualJwt.sign({ id: 'user1', papel: 'cliente' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        adminUserToken = actualJwt.sign({ id: 'admin1', papel: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    });

    beforeEach(() => {
        // Limpeza mais simples e explícita dos mocks do Supabase e jwt.sign
        jest.clearAllMocks(); // Limpa todos os mocks, incluindo o contador de chamadas
        
        // Re-mockar comportamentos padrão se jest.clearAllMocks() os removeu e são necessários globalmente
        // No nosso caso, supabase.from().select()... etc., são reconfigurados por teste com mockResolvedValueOnce
        // por isso, jest.clearAllMocks() é geralmente suficiente aqui, pois cada teste define o comportamento do mock que ele precisa.
        // A principal razão para .mockClear() individualmente seria resetar o histórico de chamadas 
        // sem limpar os comportamentos mockados, mas jest.clearAllMocks() já faz isso.
    });

    // Testes para Fluxo de Pedidos
    describe('Fluxo de Pedidos', () => {
        const pedidoPayload = {
            mesa: 10,
            itens: [
                { produto_id: 'prod1', nome: 'Hambúrguer Simples', preco: 15.00, quantidade: 1 },
                { produto_id: 'prod2', nome: 'Refrigerante Lata', preco: 5.00, quantidade: 2 }
            ],
            observacoes: 'Sem picles no hambúrguer'
        };

        test('Usuário autenticado deve conseguir criar um novo pedido', async () => {
            const valorTotalCalculadoCorretamentePeloController = pedidoPayload.itens.reduce((acc, item) => acc + (item.preco || 0), 0);
            
            const mockPedidoCriado = {
                id: 'pedido123',
                mesa: pedidoPayload.mesa,
                valor_total: valorTotalCalculadoCorretamentePeloController,
                status: 'pendente',
                observacoes: pedidoPayload.observacoes,
                criado_por: 'user1' 
            };
            supabase.select.mockResolvedValueOnce({ data: [mockPedidoCriado], error: null });

            const response = await request(app)
                .post('/api/pedidos')
                .set('Authorization', `Bearer ${regularUserToken}`)
                .send(pedidoPayload);

            expect(response.statusCode).toBe(201);
            expect(response.body.mensagem).toBe('Pedido registrado com sucesso.');
            expect(response.body.pedido).toEqual(mockPedidoCriado);
            expect(supabase.insert).toHaveBeenCalledWith([expect.objectContaining({
                criado_por: 'user1',
                mesa: pedidoPayload.mesa,
                observacoes: pedidoPayload.observacoes,
                status: 'pendente',
                valor_total: valorTotalCalculadoCorretamentePeloController
            })]);
        });

        test('Usuário autenticado deve conseguir buscar seus pedidos', async () => {
            const mockPedidosDoUsuario = [
                { id: 'pedido1', criado_por: 'user1', mesa: 1, valor_total: 20, status: 'entregue' },
                { id: 'pedido2', criado_por: 'user1', mesa: 2, valor_total: 30, status: 'pendente' }
            ];
            // Mock para supabase.from('pedidos').select(...).eq(...).order(...)
            // A última função na cadeia que retorna a Promise é 'order'
            supabase.order.mockResolvedValueOnce({ data: mockPedidosDoUsuario, error: null });

            const response = await request(app)
                .get('/api/pedidos')
                .set('Authorization', `Bearer ${regularUserToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ pedidos: mockPedidosDoUsuario });

            expect(supabase.from).toHaveBeenCalledWith('pedidos');
            expect(supabase.select).toHaveBeenCalledWith('*');
            expect(supabase.eq).toHaveBeenCalledWith('criado_por', 'user1'); // 'user1' é o ID do regularUserToken
            expect(supabase.order).toHaveBeenCalledWith('criado_em', { ascending: false });
        });

        test('Tentativa de criar pedido sem autenticação deve falhar (401)', async () => {
            const response = await request(app)
                .post('/api/pedidos')
                .send(pedidoPayload); // Sem token de autorização

            expect(response.statusCode).toBe(401);
            expect(response.body).toEqual({ erro: 'Token não fornecido.' }); // Mensagem do middleware autenticar
            expect(supabase.insert).not.toHaveBeenCalled();
        });
    });

    // Testes para Fluxo de Admin (ex: rota de cardápio POST)
    describe('Fluxo de Admin - Gerenciamento de Cardápio', () => {
        const novoProduto = { nome: 'Super Burger', categoria: 'lanches', preco: 35.90, descricao: 'Delicioso' };

        test('Admin deve conseguir adicionar um novo produto ao cardápio', async () => {
            supabase.select.mockResolvedValueOnce({ data: [{id: 'prod123', ...novoProduto}], error: null });
            const response = await request(app)
                .post('/api/cardapio')
                .set('Authorization', `Bearer ${adminUserToken}`)
                .send(novoProduto);
            
            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('mensagem', 'Produto adicionado com sucesso.');
            expect(supabase.insert).toHaveBeenCalledWith([novoProduto]);
        });

        test('Usuário comum não deve conseguir adicionar produto ao cardápio (403)', async () => {
            const response = await request(app)
                .post('/api/cardapio')
                .set('Authorization', `Bearer ${regularUserToken}`)
                .send(novoProduto);

            expect(response.statusCode).toBe(403);
            expect(response.body).toHaveProperty('erro', 'Apenas administradores podem adicionar produtos.');
            expect(supabase.insert).not.toHaveBeenCalled();
        });

        test('Tentativa de adicionar produto sem autenticação deve falhar (401)', async () => {
            const response = await request(app)
                .post('/api/cardapio')
                .send(novoProduto); // Sem token

            expect(response.statusCode).toBe(401);
            expect(response.body).toEqual({ erro: 'Token não fornecido.' });
            expect(supabase.insert).not.toHaveBeenCalled();
        });
    });
}); 