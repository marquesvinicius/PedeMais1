const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const pedidosRoutes = require('./routes/pedidos');
const cardapioRoutes = require('./routes/cardapio');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/cardapio', cardapioRoutes);

// Comentado ou removido para testes. A inicialização do servidor
// deve ocorrer em um arquivo separado (ex: server.js) que não é importado pelos testes.
/*
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
*/

module.exports = app; // Exportar o app para ser usado por supertest e server.js
