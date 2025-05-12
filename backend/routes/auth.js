const express = require('express');
const router = express.Router();
const { registrar } = require('../controller/authController');
const { login } = require('../controller/authController');

router.post('/login', login);
router.post('/register', registrar);

module.exports = router;
