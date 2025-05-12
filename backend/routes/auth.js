const express = require('express');
const router = express.Router();
const { registrar, login } = require('../controller/authController');

// Rotas de autenticação
router.post('/login', login);
router.post('/register', registrar);

module.exports = router;
