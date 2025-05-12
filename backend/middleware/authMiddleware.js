const jwt = require('jsonwebtoken');

const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ erro: 'Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ erro: 'Token inválido.' });
  }
};

const verificarAdmin = async (req, res, next) => {
  try {
    if (req.usuario.papel !== 'admin') {
      return res.status(403).json({
        erro: 'Acesso negado. Apenas administradores podem acessar este recurso.'
      });
    }
    next();
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao verificar permissões.' });
  }
};

module.exports = {
  verificarToken,
  verificarAdmin
}; 