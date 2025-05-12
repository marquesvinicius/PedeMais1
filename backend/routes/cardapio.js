const express = require('express');
const router = express.Router();
const { autenticar } = require('../middlewares/authMiddleware');
const cardapioController = require('../controller/cardapioController');

router.get('/', cardapioController.buscarCardapio);
router.post('/', autenticar, cardapioController.adicionarItem);

module.exports = router;
