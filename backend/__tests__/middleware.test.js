const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware');
const jwt = require('jsonwebtoken');

jest.mock('jsonwebtoken');

describe('Middleware de Autenticação', () => {
  let mockRequest;
  let mockResponse;
  let nextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {
        authorization: 'Bearer token_teste'
      }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  describe('verificarToken', () => {
    it('deve permitir acesso com token válido', async () => {
      jwt.verify.mockReturnValue({ id: 1, email: 'teste@teste.com' });

      await verificarToken(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.usuario).toBeDefined();
    });

    it('deve negar acesso sem token', async () => {
      mockRequest.headers.authorization = undefined;

      await verificarToken(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        erro: 'Token não fornecido.'
      });
    });

    it('deve negar acesso com token inválido', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Token inválido');
      });

      await verificarToken(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        erro: 'Token inválido.'
      });
    });
  });

  describe('verificarAdmin', () => {
    it('deve permitir acesso para admin', async () => {
      mockRequest.usuario = { papel: 'admin' };

      await verificarAdmin(mockRequest, mockResponse, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('deve negar acesso para usuário não admin', async () => {
      mockRequest.usuario = { papel: 'usuario' };

      await verificarAdmin(mockRequest, mockResponse, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        erro: 'Acesso negado. Apenas administradores podem acessar este recurso.'
      });
    });
  });
}); 