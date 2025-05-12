const { login, registrar } = require('../controller/authController');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../services/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockImplementation((table) => {
      if (table === 'usuarios') {
        return {
          select: () => ({
            eq: () => ({
              limit: () => ({
                data: [{ id: 1, nome: 'Teste', email: 'teste@teste.com', senha: 'senha123', papel: 'admin' }],
                error: null
              }),
              maybeSingle: () => ({
                data: null,
                error: null
              })
            })
          }),
          insert: () => ({
            data: [{ id: 1, nome: 'Teste', email: 'teste@teste.com', papel: 'admin' }],
            error: null
          })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockReturnThis()
      };
    })
  }
}));

describe('Auth Controller', () => {
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    mockRequest = {
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('registrar', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      mockRequest.body = {
        nome: 'Teste',
        email: 'teste@teste.com',
        senha: 'senha123',
        papel: 'admin'
      };

      bcrypt.hash.mockResolvedValue('senha_criptografada');

      await registrar(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        mensagem: 'Usuário registrado com sucesso.'
      });
    });

    it('deve retornar erro quando campos obrigatórios estão faltando', async () => {
      mockRequest.body = {
        nome: 'Teste',
        email: 'teste@teste.com'
      };

      await registrar(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        erro: 'Todos os campos são obrigatórios.'
      });
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      mockRequest.body = {
        email: 'teste@teste.com',
        senha: 'senha123'
      };

      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token_jwt');

      await login(mockRequest, mockResponse);

      expect(mockResponse.json).toHaveBeenCalledWith({
        token: 'token_jwt'
      });
    });

    it('deve retornar erro com credenciais inválidas', async () => {
      mockRequest.body = {
        email: 'teste@teste.com',
        senha: 'senha_errada'
      };

      bcrypt.compare.mockResolvedValue(false);

      await login(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        erro: 'Senha incorreta.'
      });
    });
  });
}); 