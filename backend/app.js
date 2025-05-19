const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const pedidosRoutes = require('./routes/pedidos');
const cardapioRoutes = require('./routes/cardapio');
const usuarioRoutes = require('./routes/usuarioRoutes');

const app = express();

// Middleware de log para todas as requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/cardapio', cardapioRoutes);
app.use('/api/usuarios', usuarioRoutes);

// Comentado ou removido para testes. A inicialização do servidor
// deve ocorrer em um arquivo separado (ex: server.js) que não é importado pelos testes.
/*
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
*/

// Middleware de erro
app.use((err, req, res, next) => {
    console.error('Erro na aplicação:', err.stack);
    res.status(500).json({ message: 'Erro interno do servidor' });
});

module.exports = app; // Exportar o app para ser usado por supertest e server.js
