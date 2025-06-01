// Configurações centralizadas do PedeMais1
// Nota: A ANON_KEY do Supabase é pública por design e segura para uso no frontend

// Configuração do ambiente
const isDevelopment = window.location.hostname.includes('localhost')

// URLs da API
export const BASE_URL = isDevelopment
    ? 'http://localhost:5000'
    : 'https://pede-backend.onrender.com'

// Configurações do Supabase
export const SUPABASE_CONFIG = {
    url: 'https://kecthdahzuzjoilfntiq.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtlY3RoZGFoenV6am9pbGZudGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzODE5NjEsImV4cCI6MjA2MTk1Nzk2MX0.3jFEYqQFr00hE4jmNtE7iZjXqbei5MgpVD_IRwiGKkw'
}

// Configurações gerais da aplicação
export const APP_CONFIG = {
    name: 'PedeMais1',
    version: '1.0.0',
    tokenExpiration: 30 * 24 * 60 * 60 * 1000, // 30 dias em millisegundos
    autoRefreshInterval: 30000 // 30 segundos para refresh automático de pedidos
}
