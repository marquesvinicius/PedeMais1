// supabase.js
import { SUPABASE_CONFIG } from './view/scripts/config.js'

let supabaseClient = null

// Função para inicializar o Supabase
function initializeSupabase() {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
        // Criar a instância do Supabase se não existir
        if (!supabaseClient) {
            supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
            console.log('Supabase inicializado com sucesso!')
        }
        return supabaseClient
    } else {
        console.error('Supabase não está disponível. Verifique se o script foi carregado.')
        return null
    }
}

// Função para aguardar o carregamento do Supabase
export function waitForSupabase() {
    return new Promise((resolve) => {
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            resolve(initializeSupabase())
        } else {
            // Aguardar até o script estar disponível
            const checkSupabase = setInterval(() => {
                if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
                    clearInterval(checkSupabase)
                    resolve(initializeSupabase())
                }
            }, 100)
            
            // Timeout de segurança após 5 segundos
            setTimeout(() => {
                clearInterval(checkSupabase)
                console.error('Timeout: Supabase não foi carregado')
                resolve(null)
            }, 5000)
        }
    })
}

// Tentar inicializar imediatamente
const client = initializeSupabase()
if (client) {
    window.supabaseClient = client
}

// Exportar a instância do Supabase
export const supabase = supabaseClient

// Se o Supabase não foi inicializado, tentar novamente quando o DOM estiver carregado
if (!supabaseClient) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const client = initializeSupabase()
            if (client) {
                window.supabaseClient = client
            }
        })
    }
}

