const express = require('express');
const router = express.Router();
const { autenticar } = require('../middlewares/authMiddleware');
const relatoriosController = require('../controller/relatoriosController');

// Rota de teste simples sem autenticação
router.get('/teste', (req, res) => {
    res.json({ 
        message: 'Rota de relatórios funcionando!',
        timestamp: new Date().toISOString()
    });
});

// Rota para relatório geral de pedidos
router.get('/geral', autenticar, relatoriosController.relatorioGeral);

// Rota para relatório de vendas (resumo)
router.get('/vendas', autenticar, relatoriosController.relatorioVendas);

// Rota para relatório por mesa
router.get('/mesas', autenticar, relatoriosController.relatorioPorMesa);

module.exports = router; 