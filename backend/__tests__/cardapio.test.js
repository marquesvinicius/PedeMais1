const { buscarCardapio, adicionarItem } = require('../controller/cardapioController');
const { supabaseMock } = require('../mocks/supabaseMock');

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

jest.mock('../services/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockImplementation((table) => {
      if (table === 'produtos') {
        return {
          select: () => ({
            order: () => ({
              data: [
                { id: 1, nome: 'Produto 1', descricao: 'Descrição 1', preco: 10, categoria: 'Bebidas' }
              ],
              error: null
            })
          }),
          insert: () => ({
            select: () => ({
              data: [{ id: 1, nome: 'Produto 1', descricao: 'Descrição 1', preco: 10, categoria: 'Bebidas' }],
              error: null
            })
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

describe('Cardápio Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {},
      usuario: { isAdmin: true }
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('buscarCardapio', () => {
    it('deve retornar a lista de itens do cardápio', async () => {
      await buscarCardapio(req, res);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('adicionarItem', () => {
    it('deve adicionar um novo item ao cardápio', async () => {
      req.body = {
        nome: 'X-Burger',
        descricao: 'Hambúrguer com queijo',
        preco: 15.90,
        categoria: 'Lanches'
      };

      await adicionarItem(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it('deve retornar erro se não for admin', async () => {
      req.usuario = { isAdmin: false };
      await adicionarItem(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        erro: 'Apenas administradores podem adicionar itens.'
      });
    });
  });
}); 