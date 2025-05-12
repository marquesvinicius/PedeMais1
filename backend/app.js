const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const pedidosRoutes = require('./routes/pedidos');
const cardapioRoutes = require('./routes/cardapio');

const app = express();

// Configuração do CORS
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/cardapio', cardapioRoutes);

// Rota de teste
app.get('/api/test', (req, res) => {
    res.json({ message: 'API está funcionando!' });
});

// Inicialização do servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
    console.log('Rotas disponíveis:');
    console.log('- GET  /api/test');
    console.log('- POST /api/auth/login');
    console.log('- POST /api/auth/register');
});
