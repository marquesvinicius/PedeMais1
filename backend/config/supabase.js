const { createClient } = require('@supabase/supabase-js');

// Detecta se está em ambiente de teste
const isTestEnvironment = process.env.NODE_ENV === 'test';

// Valores reais ou mock dependendo do ambiente
const supabaseUrl = isTestEnvironment ? 'https://mock.supabase.co' : process.env.SUPABASE_URL;
const supabaseKey = isTestEnvironment ? 'mock-key-for-testing' : process.env.SUPABASE_KEY;

// Verifica se as variáveis estão definidas em produção
if (!isTestEnvironment && (!supabaseUrl || !supabaseKey)) {
    throw new Error('SUPABASE_URL e SUPABASE_KEY são obrigatórios no arquivo .env');
}

// Cria o cliente real ou um mock dependendo do ambiente
let supabase;

if (isTestEnvironment) {
    // Mock do cliente Supabase para testes
    supabase = {
        from: (table) => ({
            select: () => ({
                eq: () => ({
                    single: () => ({ data: null, error: null })
                }),
                limit: () => ({ data: [], error: null }),
                order: () => ({ data: [], error: null })
            }),
            insert: () => ({
                select: () => ({
                    single: () => ({ 
                        data: { 
                            id: 1, 
                            nome: 'Test User', 
                            email: 'test@example.com',
                            papel: 'admin',
                            criado_em: new Date().toISOString()
                        }, 
                        error: null 
                    })
                })
            }),
            update: () => ({
                eq: () => ({ data: { success: true }, error: null })
            }),
            delete: () => ({
                eq: () => ({ data: { success: true }, error: null })
            })
        }),
        auth: {
            signUp: () => ({ data: { user: { id: 'test-user-id' } }, error: null }),
            signInWithPassword: () => ({ 
                data: { 
                    session: { 
                        access_token: 'mock-token',
                        user: { id: 'test-user-id' }
                    } 
                }, 
                error: null 
            })
        }
    };
} else {
    // Cliente Supabase real
    supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = supabase; 