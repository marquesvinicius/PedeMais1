const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validarSenha = (senha) => {
  // Mínimo 8 caracteres, pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(senha);
};

const validarPreco = (preco) => {
  if (typeof preco !== 'number') return false;
  return preco >= 0;
};

module.exports = {
  validarEmail,
  validarSenha,
  validarPreco
}; 