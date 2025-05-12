const { validarEmail, validarSenha, validarPreco } = require('../utils/validacao');

describe('Validação de Dados', () => {
  describe('validarEmail', () => {
    it('deve aceitar email válido', () => {
      expect(validarEmail('teste@teste.com')).toBe(true);
    });

    it('deve rejeitar email inválido', () => {
      expect(validarEmail('email_invalido')).toBe(false);
      expect(validarEmail('teste@')).toBe(false);
      expect(validarEmail('@teste.com')).toBe(false);
    });
  });

  describe('validarSenha', () => {
    it('deve aceitar senha forte', () => {
      expect(validarSenha('Senha@123')).toBe(true);
    });

    it('deve rejeitar senha fraca', () => {
      expect(validarSenha('123456')).toBe(false); // Muito curta
      expect(validarSenha('abcdefgh')).toBe(false); // Sem números
      expect(validarSenha('12345678')).toBe(false); // Sem letras
      expect(validarSenha('abcdef12')).toBe(false); // Sem caracteres especiais
    });
  });

  describe('validarPreco', () => {
    it('deve aceitar preço válido', () => {
      expect(validarPreco(10.50)).toBe(true);
      expect(validarPreco(0)).toBe(true);
    });

    it('deve rejeitar preço inválido', () => {
      expect(validarPreco(-10)).toBe(false);
      expect(validarPreco('abc')).toBe(false);
    });
  });
}); 