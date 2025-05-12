const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabase } = require('../config/supabase');

// Login
const login = async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });
    }

    const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .limit(1);

    if (error || usuarios.length === 0) {
        return res.status(401).json({ erro: 'Usuário não encontrado.' });
    }

    const usuario = usuarios[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
        return res.status(401).json({ erro: 'Senha incorreta.' });
    }

    const token = jwt.sign(
        { id: usuario.id, email: usuario.email, papel: usuario.papel },
        process.env.JWT_SECRET || 'sua_chave_secreta_aqui',
        { expiresIn: '6h' }
    );

    res.json({ token });
};

// Registro
const registrar = async (req, res) => {
    const { nome, email, senha, papel } = req.body;

    if (!nome || !email || !senha || !papel) {
        return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
    }

    const { data: existente } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .maybeSingle();

    if (existente) {
        return res.status(409).json({ erro: 'Email já cadastrado.' });
    }

    const senhaCriptografada = await bcrypt.hash(senha, 10);

    const { data, error } = await supabase
        .from('usuarios')
        .insert([{ nome, email, senha: senhaCriptografada, papel }]);

    if (error) {
        return res.status(500).json({ erro: 'Erro ao registrar usuário.' });
    }

    res.status(201).json({ mensagem: 'Usuário registrado com sucesso.' });
};

module.exports = { login, registrar };
