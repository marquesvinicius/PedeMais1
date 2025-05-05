import { supabase } from '../../supabase.js';

export class UsuarioModel {
    // Authenticate a user with email and password
    static async autenticarUsuario(email, senha) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: senha,
            });

            if (error) {
                throw new Error(`Erro ao autenticar: ${error.message}`);
            }

            return {
                user: data.user,
                session: data.session,
            };
        } catch (error) {
            throw error;
        }
    }

    // Sign out the current user
    static async encerrarSessao() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                throw new Error(`Erro ao encerrar sessão: ${error.message}`);
            }
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Get the current session
    static async obterSessaoAtual() {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                throw new Error(`Erro ao obter sessão: ${error.message}`);
            }
            return data.session;
        } catch (error) {
            throw error;
        }
    }

    // Get the current user
    static async obterUsuarioAtual() {
        try {
            const { data, error } = await supabase.auth.getUser();
            if (error) {
                throw new Error(`Erro ao obter usuário: ${error.message}`);
            }
            return data.user;
        } catch (error) {
            throw error;
        }
    }
}