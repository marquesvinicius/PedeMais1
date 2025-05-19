const express = require('express');
const router = express.Router();
const usuarioController = require('../controller/usuarioController');

// Rota de teste
router.get('/teste', (req, res) => {
    console.log('Rota de teste acessada');
    res.json({ message: 'API de usuários funcionando corretamente' });
});

// Rota para cadastro de usuários
router.post('/cadastro', usuarioController.cadastrar);

module.exports = router; 