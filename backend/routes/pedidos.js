const express = require('express');
const router = express.Router();
const { autenticar } = require('../middlewares/authMiddleware');
const pedidosController = require('../controller/pedidosController');

router.get('/', autenticar, pedidosController.buscarPedidos);
router.post('/', autenticar, pedidosController.createPedido);
router.patch('/:id', autenticar, pedidosController.atualizarStatusPedido);
// outros...

module.exports = router;
