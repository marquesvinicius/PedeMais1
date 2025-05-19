const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

const usuarioController = {
    async cadastrar(req, res) {
        try {
            const { nome, email, senha, tipoUsuario } = req.body;
            
            console.log('Iniciando cadastro de usuário:', { nome, email, tipoUsuario });

            // Validação dos campos obrigatórios
            if (!nome || !email || !senha || !tipoUsuario) {
                console.log('Campos obrigatórios faltando:', { nome, email, senha, tipoUsuario });
                return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
            }

            // Validação do tipo de usuário
            if (!['admin', 'funcionario'].includes(tipoUsuario)) {
                console.log('Tipo de usuário inválido:', tipoUsuario);
                return res.status(400).json({ message: 'Tipo de usuário inválido' });
            }

            // Verifica se o email já está cadastrado
            console.log('Verificando email existente:', email);
            const { data: usuarioExistente, error: errorBusca } = await supabase
                .from('usuarios')
                .select('email')
                .eq('email', email)
                .single();

            if (errorBusca && errorBusca.code !== 'PGRST116') {
                console.error('Erro ao verificar email:', errorBusca);
                return res.status(500).json({ message: 'Erro ao verificar email' });
            }

            if (usuarioExistente) {
                console.log('Email já cadastrado:', email);
                return res.status(400).json({ message: 'Email já cadastrado' });
            }

            // Criptografa a senha
            console.log('Criptografando senha...');
            const senhaCriptografada = await bcrypt.hash(senha, 10);

            // Vamos mostrar a estrutura exata da tabela para debug
            console.log('Consultando estrutura da tabela...');
            const { data: colunas, error: erroColunas } = await supabase
                .from('usuarios')
                .select('*')
                .limit(1);
                
            if (erroColunas) {
                console.log('Erro ao consultar estrutura:', erroColunas);
            } else {
                // Se tivermos algum registro, vamos ver a estrutura
                if (colunas && colunas.length > 0) {
                    console.log('Estrutura da tabela:', Object.keys(colunas[0]));
                } else {
                    console.log('Tabela vazia, não foi possível verificar estrutura');
                }
            }

            // Insere o novo usuário com o nome correto da coluna 'papel'
            console.log('Inserindo novo usuário...');
            const { data: novoUsuario, error: errorInsert } = await supabase
                .from('usuarios')
                .insert([
                    {
                        nome,
                        email,
                        senha: senhaCriptografada,
                        papel: tipoUsuario  // Corrigido para usar o nome real da coluna 'papel'
                    }
                ])
                .select()
                .single();

            if (errorInsert) {
                console.error('Erro ao cadastrar usuário:', errorInsert);
                return res.status(500).json({ message: 'Erro ao cadastrar usuário' });
            }

            console.log('Usuário cadastrado com sucesso:', novoUsuario.id);

            // Gera o token JWT
            console.log('Gerando token de autenticação...');
            try {
                // Primeiro cria o usuário no auth do Supabase
                const { data: authUser, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password: senha
                });

                if (signUpError) {
                    console.error('Erro ao criar usuário no auth:', signUpError);
                    // Continue mesmo com erro, pois o usuário já foi criado na tabela usuarios
                }

                // Faz login para obter o token
                const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password: senha
                });

                if (signInError) {
                    console.error('Erro ao fazer login:', signInError);
                    // Se não conseguiu gerar token, retorna o usuário sem token
                    const { senha: _, ...usuarioSemSenha } = novoUsuario;
                    return res.status(201).json({
                        usuario: usuarioSemSenha,
                        message: 'Usuário criado, mas ocorreu um problema na autenticação. Tente fazer login.'
                    });
                }

                console.log('Token gerado com sucesso');

                // Retorna os dados do usuário (exceto a senha) e o token
                const { senha: _, ...usuarioSemSenha } = novoUsuario;
                res.status(201).json({
                    usuario: usuarioSemSenha,
                    token: session.access_token
                });
            } catch (authError) {
                console.error('Erro no processo de autenticação:', authError);
                // Se ocorreu erro no processo de autenticação, retorna o usuário sem token
                const { senha: _, ...usuarioSemSenha } = novoUsuario;
                res.status(201).json({
                    usuario: usuarioSemSenha,
                    message: 'Usuário criado, mas ocorreu um problema na autenticação. Tente fazer login.'
                });
            }

        } catch (error) {
            console.error('Erro não tratado no cadastro:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    }
};

module.exports = usuarioController; 