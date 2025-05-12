const request = require('supertest');
const app = require('../app');
const { supabase } = require('../services/supabaseClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock Supabase
jest.mock('../services/supabaseClient', () => ({
    supabase: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(), // .eq('email', email) retorna this
        limit: jest.fn().mockReturnThis(), // para o .limit(1) no login
        maybeSingle: jest.fn(), // .maybeSingle() resolverá a Promise para verificação de email existente
        insert: jest.fn(),      // .insert() resolverá a Promise para inserção de usuário
    }
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
}));


describe('Testes de Autenticação', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Limpeza específica para mocks
        supabase.from.mockClear();
        supabase.select.mockClear();
        supabase.eq.mockClear();
        supabase.limit.mockClear();
        supabase.maybeSingle.mockClear();
        supabase.insert.mockClear();
        bcrypt.hash.mockClear();
        bcrypt.compare.mockClear();
        jwt.sign.mockClear();
    });

    // Testes para Registro de Usuário
    describe('POST /api/auth/register - Registro de Usuário', () => {
        const userDataBase = {
            nome: 'Usuário Teste',
            email: 'teste@example.com',
            senha: 'senha123',
            papel: 'cliente' 
        };
        const hashedSenha = 'senhaHasheada123';

        test('Registro bem-sucedido de novo usuário', async () => {
            supabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
            bcrypt.hash.mockResolvedValueOnce(hashedSenha);
            supabase.insert.mockResolvedValueOnce({ data: [{ id: 'userId123', ...userDataBase, senha: hashedSenha }], error: null });

            const response = await request(app)
                .post('/api/auth/register')
                .send(userDataBase);

            expect(response.statusCode).toBe(201);
            expect(response.body).toEqual({ mensagem: 'Usuário registrado com sucesso.' });
            expect(supabase.from).toHaveBeenCalledWith('usuarios');
            expect(supabase.eq).toHaveBeenCalledWith('email', userDataBase.email);
            expect(supabase.maybeSingle).toHaveBeenCalledTimes(1);
            expect(bcrypt.hash).toHaveBeenCalledWith(userDataBase.senha, 10);
            expect(supabase.insert).toHaveBeenCalledWith([{
                nome: userDataBase.nome,
                email: userDataBase.email,
                senha: hashedSenha,
                papel: userDataBase.papel
            }]);
        });

        test('Validação de campos obrigatórios (nome, email, senha, papel)', async () => {
            const casosInvalidos = [
                { ...userDataBase, nome: undefined },
                { ...userDataBase, email: undefined },
                { ...userDataBase, senha: undefined },
                { ...userDataBase, papel: undefined },
                { nome: 'Nome' }, // Apenas um campo
                { email: 'email@example.com' },
                {}
            ];

            for (const payload of casosInvalidos) {
                // Limpar mocks que não devem ser chamados
                supabase.insert.mockClear();
                supabase.maybeSingle.mockClear(); // A verificação de email não deve ocorrer
                supabase.eq.mockClear();
                bcrypt.hash.mockClear();

                const response = await request(app)
                    .post('/api/auth/register')
                    .send(payload);
                
                expect(response.statusCode).toBe(400);
                expect(response.body).toEqual({ erro: 'Todos os campos são obrigatórios.' });
                expect(supabase.maybeSingle).not.toHaveBeenCalled();
                expect(bcrypt.hash).not.toHaveBeenCalled();
                expect(supabase.insert).not.toHaveBeenCalled();
            }
        });

        test('Deve retornar erro 409 se o email já estiver cadastrado', async () => {
            // Simular que o email já existe
            supabase.maybeSingle.mockResolvedValueOnce({ 
                data: { id: 'anotherUserId', email: userDataBase.email, nome: 'Outro Nome', papel: 'cliente' }, 
                error: null 
            });

            const response = await request(app)
                .post('/api/auth/register')
                .send(userDataBase); // Tenta registrar com email existente

            expect(response.statusCode).toBe(409);
            expect(response.body).toEqual({ erro: 'Email já cadastrado.' });

            // Verificar que as operações subsequentes não ocorreram
            expect(bcrypt.hash).not.toHaveBeenCalled();
            expect(supabase.insert).not.toHaveBeenCalled();
            
            // Verificar que a busca por email foi feita
            expect(supabase.from).toHaveBeenCalledWith('usuarios');
            expect(supabase.eq).toHaveBeenCalledWith('email', userDataBase.email);
            expect(supabase.maybeSingle).toHaveBeenCalledTimes(1);
        });

        test('Deve retornar erro 500 se o insert no banco falhar', async () => {
            // 1. Simular que o email não existe
            supabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
            
            // 2. Simular bcrypt.hash funcionando
            bcrypt.hash.mockResolvedValueOnce(hashedSenha);

            // 3. Simular falha no supabase.insert
            const dbError = { message: 'Erro simulado ao inserir no banco' };
            supabase.insert.mockResolvedValueOnce({ data: null, error: dbError });

            const response = await request(app)
                .post('/api/auth/register')
                .send(userDataBase);

            expect(response.statusCode).toBe(500);
            expect(response.body).toEqual({ erro: 'Erro ao registrar usuário.' }); // Mensagem genérica do controller
            
            // Verificar chamadas
            expect(supabase.maybeSingle).toHaveBeenCalledTimes(1);
            expect(bcrypt.hash).toHaveBeenCalledWith(userDataBase.senha, 10);
            expect(supabase.insert).toHaveBeenCalledWith([{
                nome: userDataBase.nome,
                email: userDataBase.email,
                senha: hashedSenha,
                papel: userDataBase.papel
            }]);
        });
    });

    // Testes para Login
    describe('POST /api/auth/login - Login', () => {
        const loginCredentialsBase = { // Renomeado para evitar conflito se usado em loop
            email: 'login@example.com',
            senha: 'senhaLogin123'
        };
        const hashedLoginSenha = 'hashedLoginSenha123';
        const mockUserFromDb = {
            id: 'userIdLogin',
            email: loginCredentialsBase.email,
            nome: 'Usuário de Login',
            senha: hashedLoginSenha,
            papel: 'cliente'
        };
        const mockJwtToken = 'mocked.jwt.token';

        test('Login bem-sucedido com credenciais válidas e geração de token JWT', async () => {
            // 1. Simular busca de usuário bem-sucedida
            supabase.limit.mockResolvedValueOnce({ data: [mockUserFromDb], error: null });

            // 2. Simular bcrypt.compare retornando true
            bcrypt.compare.mockResolvedValueOnce(true);

            // 3. Simular jwt.sign retornando um token
            jwt.sign.mockReturnValueOnce(mockJwtToken);

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginCredentialsBase);

            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual({ token: mockJwtToken });

            // Verificar chamadas ao Supabase
            expect(supabase.from).toHaveBeenCalledWith('usuarios');
            expect(supabase.select).toHaveBeenCalledWith('*');
            expect(supabase.eq).toHaveBeenCalledWith('email', loginCredentialsBase.email);
            expect(supabase.limit).toHaveBeenCalledWith(1);
            
            // Verificar chamada ao bcrypt.compare
            expect(bcrypt.compare).toHaveBeenCalledWith(loginCredentialsBase.senha, mockUserFromDb.senha);

            // Verificar chamada ao jwt.sign
            expect(jwt.sign).toHaveBeenCalledWith(
                { id: mockUserFromDb.id, email: mockUserFromDb.email, papel: mockUserFromDb.papel },
                process.env.JWT_SECRET, // Assegure-se que JWT_SECRET está no .env para os testes ou mocke process.env
                { expiresIn: '6h' }
            );
        });

        test('Deve retornar erro 401 se o email não for encontrado', async () => {
            // Simular que o usuário não é encontrado no banco
            supabase.limit.mockResolvedValueOnce({ data: [], error: null });

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginCredentialsBase);

            expect(response.statusCode).toBe(401);
            expect(response.body).toEqual({ erro: 'Usuário não encontrado.' });

            // Verificar que as operações subsequentes não ocorreram
            expect(bcrypt.compare).not.toHaveBeenCalled();
            expect(jwt.sign).not.toHaveBeenCalled();

            // Verificar que a busca no DB foi tentada
            expect(supabase.eq).toHaveBeenCalledWith('email', loginCredentialsBase.email);
            expect(supabase.limit).toHaveBeenCalledWith(1);
        });

        test('Deve retornar erro 401 se a senha estiver incorreta (bcrypt.compare retorna false)', async () => {
            // 1. Simular busca de usuário bem-sucedida
            supabase.limit.mockResolvedValueOnce({ data: [mockUserFromDb], error: null });

            // 2. Simular bcrypt.compare retornando false (senha incorreta)
            bcrypt.compare.mockResolvedValueOnce(false);

            const response = await request(app)
                .post('/api/auth/login')
                .send(loginCredentialsBase); // Envia a senha correta, mas o compare falha

            expect(response.statusCode).toBe(401);
            expect(response.body).toEqual({ erro: 'Senha incorreta.' });

            // Verificar que jwt.sign não foi chamado
            expect(jwt.sign).not.toHaveBeenCalled();

            // Verificar que a busca e a comparação de senha foram tentadas
            expect(supabase.eq).toHaveBeenCalledWith('email', loginCredentialsBase.email);
            expect(bcrypt.compare).toHaveBeenCalledWith(loginCredentialsBase.senha, mockUserFromDb.senha);
        });

        test('Deve retornar erro 400 com campos inválidos/ausentes (email, senha)', async () => {
            const casosInvalidos = [
                { senha: 'algumaSenha' }, // Sem email
                { email: 'teste@example.com' }, // Sem senha
                {}
            ];

            for (const payload of casosInvalidos) {
                // Limpar mocks para garantir que não foram chamados nesta iteração
                supabase.limit.mockClear();
                supabase.eq.mockClear(); // eq é chamado antes de limit
                bcrypt.compare.mockClear();
                jwt.sign.mockClear();

                const response = await request(app)
                    .post('/api/auth/login')
                    .send(payload);

                expect(response.statusCode).toBe(400);
                expect(response.body).toEqual({ erro: 'Email e senha são obrigatórios.' });

                expect(supabase.limit).not.toHaveBeenCalled();
                expect(bcrypt.compare).not.toHaveBeenCalled();
                expect(jwt.sign).not.toHaveBeenCalled();
            }
        });
    });
}); 