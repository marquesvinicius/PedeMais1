const request = require('supertest');
const app = require('../app'); // Ajuste o caminho conforme necessário
// Não precisamos mais importar supabase diretamente aqui se o controller usa o mockado
// const { supabase } = require('../services/supabaseClient'); 

// Mock para o cliente Supabase
jest.mock('../services/supabaseClient', () => ({
    supabase: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
    }
}));

// Mock para o middleware de autenticação
const mockAdminToken = 'mockAdminToken';
jest.mock('../middlewares/authMiddleware', () => ({
    autenticar: (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token === mockAdminToken) {
                req.user = { id: 'mockAdminId', papel: 'admin' }; // Simula um usuário admin
                return next();
            }
        }
        // Se não for o token de admin mockado, simula falha na autenticação
        return res.status(401).json({ erro: 'Token inválido ou ausente' });
    }
}));

// Importar supabase APÓS o mock de supabaseClient ser definido.
// E garantir que estamos usando o mesmo objeto mockado nas verificações.
const { supabase } = require('../services/supabaseClient'); 

describe('Testes de Cardápio', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Limpa todos os mocks antes de CADA teste no describe
        // Limpar especificamente os mocks do supabase também, se necessário, pois são mais complexos
        supabase.from.mockClear();
        supabase.select.mockClear();
        supabase.order.mockClear();
        supabase.insert.mockClear();
    });

    // Testes para Busca do Cardápio
    describe('GET /cardapio - Busca do Cardápio', () => {
        test('Deve listar todos os produtos do cardápio ordenados', async () => {
            const mockProdutos = [
                { id: 1, nome: 'Hambúrguer', categoria: 'lanches', preco: 25.00 },
                { id: 2, nome: 'Pizza', categoria: 'lanches', preco: 30.00 },
                { id: 3, nome: 'Refrigerante', categoria: 'bebidas', preco: 5.00 },
            ];
            supabase.order.mockResolvedValueOnce({ data: mockProdutos, error: null });

            const response = await request(app).get('/api/cardapio');

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(mockProdutos);
            expect(supabase.from).toHaveBeenCalledWith('produtos');
            expect(supabase.select).toHaveBeenCalledWith('*');
            expect(supabase.order).toHaveBeenCalledWith('categoria, nome');
        });

        test('Deve retornar erro 500 se a busca falhar', async () => {
            supabase.order.mockResolvedValueOnce({ data: null, error: { message: 'Erro ao buscar' } });

            const response = await request(app).get('/api/cardapio');

            expect(response.statusCode).toBe(500);
            expect(response.body).toHaveProperty('erro');
            expect(response.body.detalhes).toBe('Erro ao buscar');
        });
    });

    // Testes para Adição de Produtos
    describe('POST /cardapio - Adição de Produtos', () => {
        const novoProdutoBase = { nome: 'Suco Natural', categoria: 'bebidas', preco: 8.00, descricao: 'Laranja' };
        // mockAdminToken é definido globalmente

        test.skip('Deve adicionar um novo produto com sucesso (admin)', async () => {
            supabase.select.mockResolvedValueOnce({ data: [{ id: 4, ...novoProdutoBase }], error: null }); 
            // Nota: o insert().select() é uma cadeia, o insert retorna this, o select resolve.

            const response = await request(app)
                .post('/api/cardapio')
                .set('Authorization', `Bearer ${mockAdminToken}`)
                .send(novoProdutoBase);

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('mensagem', 'Produto adicionado com sucesso.');
            expect(response.body.produto).toMatchObject(novoProdutoBase);
            expect(supabase.from).toHaveBeenCalledWith('produtos');
            expect(supabase.insert).toHaveBeenCalledWith([novoProdutoBase]);
            expect(supabase.select).toHaveBeenCalledTimes(1);
        });

        test('Não deve adicionar produto sem campos obrigatórios (admin)', async () => {
            const camposInvalidosParaTestar = [
                { payload: { categoria: 'bebidas', preco: 8.00 }, missing: 'nome' },
                { payload: { nome: 'Suco', preco: 8.00 }, missing: 'categoria' },
                { payload: { nome: 'Suco', categoria: 'bebidas'}, missing: 'preco' }
            ];

            for (const caso of camposInvalidosParaTestar) {
                supabase.insert.mockClear(); 
                supabase.select.mockClear(); // Limpar select também, pois é chamado após insert

                const response = await request(app)
                    .post('/api/cardapio')
                    .set('Authorization', `Bearer ${mockAdminToken}`)
                    .send(caso.payload);

                expect(response.statusCode).toBe(400);
                expect(response.body).toHaveProperty('erro', 'Nome, preço e categoria são obrigatórios.');
                expect(supabase.insert).not.toHaveBeenCalled(); 
            }
        });

        test('Não deve adicionar produto se usuário não for admin', async () => {
            const nonAdminTokens = [
                null, // Sem token
                'Bearer someOtherToken', // Token inválido/não-admin
            ];

            for (const tokenHeader of nonAdminTokens) {
                supabase.insert.mockClear();
                supabase.select.mockClear();

                let reqBuilder = request(app)
                    .post('/api/cardapio')
                    .send(novoProdutoBase);
                
                if (tokenHeader) {
                    reqBuilder = reqBuilder.set('Authorization', tokenHeader);
                }

                const response = await reqBuilder;

                expect(response.statusCode).toBe(401); // Mock de autenticar retorna 401
                expect(response.body).toHaveProperty('erro', 'Token inválido ou ausente');
                expect(supabase.insert).not.toHaveBeenCalled();
            }
        });

        test('Deve retornar erro 500 se a adição falhar no banco (admin)', async () => {
            // Configura o mock para que a operação de insert seguida de select retorne um erro
            // O controller faz: supabase.from(...).insert(...).select()
            // Se insert() falhar e retornar um erro que impede o select(), ou se o select() em si retornar o erro.
            // Vamos simular que o select APÓS o insert retorna o erro, pois o insert retorna 'this'.
            supabase.select.mockResolvedValueOnce({ data: null, error: { message: 'Falha simulada no banco' } });

            const response = await request(app)
                .post('/api/cardapio')
                .set('Authorization', `Bearer ${mockAdminToken}`)
                .send(novoProdutoBase);

            expect(response.statusCode).toBe(500);
            expect(response.body).toHaveProperty('erro', 'Erro ao adicionar produto.');
            expect(response.body).toHaveProperty('detalhes', 'Falha simulada no banco');
            
            // Verificar se o insert foi tentado
            expect(supabase.insert).toHaveBeenCalledWith([novoProdutoBase]);
            // E se o select subsequente também foi chamado (onde o erro foi mockado)
            expect(supabase.select).toHaveBeenCalledTimes(1);
        });
    });
}); 