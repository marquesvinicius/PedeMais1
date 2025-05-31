// supabase.js

const SUPABASE_URL = 'https://kecthdahzuzjoilfntiq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlY3RoZGFoenV6am9pbGZudGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzODE5NjEsImV4cCI6MjA2MTk1Nzk2MX0.3jFEYqQFr00hE4jmNtE7iZjXqbei5MgpVD_IRwiGKkw'

// Aguardar o carregamento do script do Supabase
function initializeSupabase() {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        // Criar a instância do Supabase
        const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        
        // Disponibilizar globalmente
        window.supabase = supabaseClient
        
        console.log('Supabase inicializado com sucesso!')
        return supabaseClient
    } else {
        console.error('Supabase não está disponível. Verifique se o script foi carregado.')
        return null
    }
}

// Tentar inicializar imediatamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSupabase)
} else {
    initializeSupabase()
}

// Exportar para uso em módulos
export const supabase = initializeSupabase()

