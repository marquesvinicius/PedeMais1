const { createPedido, buscarPedidos, atualizarStatusPedido } = require('../controller/pedidosController');

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

jest.mock('../services/supabaseClient', () => {
  const eqMock = jest.fn(() => ({ data: null, error: null }));
  const supabase = {
    from: jest.fn().mockImplementation((table) => {
      if (table === 'pedidos') {
        return {
          select: () => ({
            eq: () => ({
              order: () => ({
                data: [
                  { id: 1, mesa: 1, status: 'pendente', valor_total: 50, observacoes: 'Teste', criado_por: 1 }
                ],
                error: null
              })
            })
          }),
          insert: () => ({
            select: () => ({
              data: [{ id: 1, mesa: 1, status: 'pendente', valor_total: 50, observacoes: 'Teste', criado_por: 1 }],
              error: null
            })
          }),
          update: () => ({ eq: eqMock })
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
  };
  supabase.__eqMock = eqMock;
  return { supabase };
});

describe('Pedidos Controller', () => {
  let mockRequest;
  let mockResponse;
  let supabase;

  beforeEach(() => {
    mockRequest = {
      body: {},
      user: { id: 1 }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    supabase = require('../services/supabaseClient').supabase;
    supabase.__eqMock.mockReset();
    supabase.__eqMock.mockImplementation(() => ({ data: null, error: null }));
  });

  describe('createPedido', () => {
    it('deve criar um novo pedido com sucesso', async () => {
      mockRequest.body = {
        mesa: 1,
        itens: [{ id: 1, preco: 50 }],
        observacoes: 'Teste'
      };

      await createPedido(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        mensagem: 'Pedido registrado com sucesso.',
        pedido: expect.objectContaining({
          id: 1,
          mesa: 1,
          status: 'pendente',
          valor_total: 50,
          observacoes: 'Teste',
          criado_por: 1
        })
      });
    });

    it('deve retornar erro quando itens estão faltando', async () => {
      mockRequest.body = {
        mesa: 1
      };

      await createPedido(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        erro: 'Mesa e itens são obrigatórios.'
      });
    });
  });

  describe('buscarPedidos', () => {
    it('deve listar pedidos com sucesso', async () => {
      await buscarPedidos(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        pedidos: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            mesa: 1,
            status: 'pendente',
            valor_total: 50,
            observacoes: 'Teste',
            criado_por: 1
          })
        ])
      });
    });
  });

  describe('atualizarStatusPedido', () => {
    it('deve atualizar status do pedido com sucesso', async () => {
      mockRequest.params = { id: 1 };
      mockRequest.body = { status: 'PREPARANDO' };
      // Mock eq para sucesso
      supabase.__eqMock.mockImplementation(() => ({ data: null, error: null }));

      await atualizarStatusPedido(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        mensagem: 'Status atualizado com sucesso.'
      });
    });

    it('deve retornar erro quando status é inválido', async () => {
      mockRequest.params = { id: 1 };
      mockRequest.body = { status: 'STATUS_INVALIDO' };
      // Mock eq para erro
      supabase.__eqMock.mockImplementation(() => ({ data: null, error: { message: 'Status inválido' } }));

      await atualizarStatusPedido(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        erro: 'Erro ao atualizar status.',
        detalhes: expect.any(String)
      });
    });
  });
}); 