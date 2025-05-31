// view/scripts/api/apiAuth.js
import { BASE_URL } from '../config.js'

export async function login(email, senha, lembrarLogin = false) {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
    })

    const data = await response.json()

    if (!response.ok) throw new Error(data.erro || 'Erro no login')

    // Armazenar token conforme a preferência do usuário
    if (lembrarLogin) {
        // Armazenamento persistente (sobrevive ao fechamento do navegador)
        localStorage.setItem('token', data.token)
        localStorage.setItem('lembrarLogin', 'true')
        localStorage.setItem('loginTimestamp', Date.now().toString())
        
        // Armazenar credenciais de forma segura (apenas email para conveniência)
        localStorage.setItem('ultimoEmail', email)
    } else {
        // Armazenamento de sessão (removido ao fechar o navegador)
        sessionStorage.setItem('token', data.token)
        // Limpar dados de "lembrar" se existirem
        localStorage.removeItem('lembrarLogin')
        localStorage.removeItem('loginTimestamp')
        localStorage.removeItem('ultimoEmail')
    }

    return data
}

export function verificarAutenticacao() {
    // Verificar primeiro no sessionStorage (sessão atual)
    let token = sessionStorage.getItem('token')
    
    if (!token) {
        // Se não encontrou na sessão, verificar no localStorage (lembrar login)
        token = localStorage.getItem('token')
        const lembrarLogin = localStorage.getItem('lembrarLogin')
        const loginTimestamp = localStorage.getItem('loginTimestamp')
        
        if (token && lembrarLogin === 'true' && loginTimestamp) {
            // Verificar se o login não expirou (30 dias)
            const agora = Date.now()
            const tempoLogin = parseInt(loginTimestamp)
            const diasExpiracao = 30 * 24 * 60 * 60 * 1000 // 30 dias em ms
            
            if (agora - tempoLogin > diasExpiracao) {
                // Login expirado, limpar dados
                limparDadosLembrarLogin()
                return null
            }
            
            // Login válido, mover para sessionStorage para esta sessão
            sessionStorage.setItem('token', token)
        }
    }
    
    return token ? { token } : null
}

export function fazerLogout(esquecerLogin = false) {
    // Remover token da sessão atual
    sessionStorage.removeItem('token')
    
    if (esquecerLogin) {
        // Remover também dados de "lembrar login"
        limparDadosLembrarLogin()
    }
}

export function limparDadosLembrarLogin() {
    localStorage.removeItem('token')
    localStorage.removeItem('lembrarLogin')
    localStorage.removeItem('loginTimestamp')
    localStorage.removeItem('ultimoEmail')
}

export function getUsuarioAtual() {
    // Verificar primeiro na sessão, depois no localStorage
    let token = sessionStorage.getItem('token') || localStorage.getItem('token')
    
    if (!token) return null

    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload
    } catch {
        return null
    }
}

export function getUltimoEmail() {
    return localStorage.getItem('ultimoEmail') || ''
}

export function isLembrarLoginAtivo() {
    return localStorage.getItem('lembrarLogin') === 'true'
}

export function getTempoRestanteLembrarLogin() {
    const loginTimestamp = localStorage.getItem('loginTimestamp')
    if (!loginTimestamp) return 0
    
    const agora = Date.now()
    const tempoLogin = parseInt(loginTimestamp)
    const diasExpiracao = 30 * 24 * 60 * 60 * 1000 // 30 dias em ms
    const tempoRestante = diasExpiracao - (agora - tempoLogin)
    
    return Math.max(0, Math.ceil(tempoRestante / (24 * 60 * 60 * 1000))) // dias restantes
}
