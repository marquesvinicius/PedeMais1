const { autenticar } = require('../middlewares/authMiddleware');
const jwt = require('jsonwebtoken');

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
    verify: jest.fn(),
}));

// Mock para req, res, next
const mockRequest = (authHeader) => ({
    headers: {
        authorization: authHeader,
    },
});

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn();

describe('Testes de Middleware - autenticar', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Verificação de Token', () => {
        test('Deve permitir acesso com token válido e popular req.user', () => {
            const token = 'tokenValido123';
            const decodedUser = { id: 'userId', email: 'user@example.com', papel: 'cliente' };
            const req = mockRequest(`Bearer ${token}`);
            const res = mockResponse();
            
            jwt.verify.mockReturnValueOnce(decodedUser); // Simula verificação bem-sucedida

            autenticar(req, res, mockNext);

            expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
            expect(req.user).toEqual(decodedUser);
            expect(mockNext).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });

        test('Deve negar acesso (401) se nenhum token for fornecido', () => {
            const req = mockRequest(undefined); // Sem header de autorização
            const res = mockResponse();

            autenticar(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ erro: 'Token não fornecido.' });
            expect(mockNext).not.toHaveBeenCalled();
            expect(jwt.verify).not.toHaveBeenCalled();
        });

        test('Deve negar acesso (401) se o token não estiver no formato Bearer', () => {
            const req = mockRequest('TokenInvalidoSemBearer'); 
            const res = mockResponse();

            autenticar(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(401); // O middleware autenticar trata isso como token não fornecido
            expect(res.json).toHaveBeenCalledWith({ erro: 'Token não fornecido.' });
            expect(mockNext).not.toHaveBeenCalled();
            expect(jwt.verify).not.toHaveBeenCalled();
        });

        test('Deve negar acesso (403) se o token for inválido (jwt.verify falha)', () => {
            const token = 'tokenQueVaiFalhar';
            const req = mockRequest(`Bearer ${token}`);
            const res = mockResponse();

            jwt.verify.mockImplementationOnce(() => { // Simula jwt.verify lançando erro
                throw new Error('Falha na verificação do token');
            });

            autenticar(req, res, mockNext);

            expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ erro: 'Token inválido.' });
            expect(mockNext).not.toHaveBeenCalled();
            expect(req.user).toBeUndefined();
        });

        // Os testes de "Verificação de Admin" não se aplicam diretamente aqui, pois não há middleware específico.
        // Eles seriam testados em rotas que usam este middleware e têm lógica de admin no controller.
    });
}); 