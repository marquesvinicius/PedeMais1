const express = require('express');
const { verificarToken, verificarAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// Rota protegida de admin
router.get('/dashboard', verificarToken, verificarAdmin, (req, res) => {
  res.status(200).json({ mensagem: 'Área administrativa' });
});

module.exports = router; 