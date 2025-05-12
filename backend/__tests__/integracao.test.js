const request = require('supertest');
const app = require('../app');
const jwt = require('jsonwebtoken');

// Mock do Supabase Client
jest.mock('../services/supabaseClient', () => ({
  supabase: {
    from: jest.fn().mockImplementation((table) => {
      if (table === 'usuarios') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () => ({
                data: { id: 1, email: 'usuario@teste.com', senha: 'senha123', papel: 'usuario' },
                error: null
              })
            })
          })
        };
      }
      if (table === 'pedidos') {
        return {
          insert: () => ({
            select: () => ({
              data: [{ id: 1, mesa: 1, status: 'pendente', valor_total: 50 }],
              error: null
            })
          }),
          select: () => ({
            eq: () => ({
              order: () => ({
                data: [{ id: 1, mesa: 1, status: 'pendente', valor_total: 50 }],
                error: null
              })
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

// Mock do JWT
jest.mock('jsonwebtoken');

describe('Testes de Integração', () => {
  let server;
  let token = 'token_teste';
  let adminToken = 'token_admin_teste';

  beforeAll(() => {
    // Usar porta 0 para que o sistema escolha uma porta disponível
    server = app.listen(0);
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Fluxo de Pedido', () => {
    it('deve criar e buscar um pedido', async () => {
      // Mock do JWT para usuário comum
      jwt.verify.mockImplementation(() => ({ id: 1, email: 'teste@teste.com', papel: 'usuario' }));

      // Criar pedido
      const criarResponse = await request(server)
        .post('/api/pedidos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          mesa: 1,
          itens: [{ id: 1, quantidade: 1 }]
        });

      expect(criarResponse.status).toBe(201);

      // Buscar pedido
      const buscarResponse = await request(server)
        .get('/api/pedidos')
        .set('Authorization', `Bearer ${token}`);

      expect(buscarResponse.status).toBe(200);
      expect(buscarResponse.body.pedidos).toHaveLength(1);
    });
  });

  describe('Fluxo de Admin', () => {
    it('deve permitir acesso à área administrativa apenas para admin', async () => {
      // Mock do JWT para usuário comum
      jwt.verify.mockImplementation(() => ({ id: 1, email: 'usuario@teste.com', papel: 'usuario' }));

      // Tentativa de acesso com token de usuário comum
      const responseUsuario = await request(server)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(responseUsuario.status).toBe(403);

      // Mock do JWT para admin
      jwt.verify.mockImplementation(() => ({ id: 2, email: 'admin@teste.com', papel: 'admin' }));

      // Tentativa de acesso com token de admin
      const responseAdmin = await request(server)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(responseAdmin.status).toBe(200);
    });
  });
}); 