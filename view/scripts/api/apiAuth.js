// view/scripts/api/apiAuth.js

// Configuração da API
const getApiBaseUrl = () => {
    // Em produção (Vercel), usa URL relativa
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return '/api'
    }
    
    // Em desenvolvimento, usa localhost:5000
    return 'http://localhost:5000/api'
}

// Função para limpar configurações
export function limparConfiguracoes() {
    localStorage.removeItem('apiBaseUrl')
    localStorage.removeItem('token')
}

export async function login(email, senha) {
    try {
        const apiUrl = `${getApiBaseUrl()}/auth/login`
        console.log('Tentando login em:', apiUrl)
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, senha })
        })

        console.log('Status da resposta:', response.status)
        console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()))

        // Verifica se a resposta está vazia
        const text = await response.text()
        console.log('Resposta bruta:', text)

        if (!text) {
            throw new Error('Resposta vazia do servidor')
        }

        // Tenta fazer o parse do JSON
        let data
        try {
            data = JSON.parse(text)
        } catch (e) {
            console.error('Erro ao fazer parse do JSON:', e)
            throw new Error('Resposta inválida do servidor')
        }

        if (!response.ok) {
            throw new Error(data.erro || 'Erro no login')
        }

        localStorage.setItem('token', data.token)
        return data
    } catch (error) {
        console.error('Erro detalhado:', error)
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            throw new Error('Não foi possível conectar ao servidor. Verifique se o servidor está rodando.')
        }
        throw error
    }
}

export function verificarAutenticacao() {
    const token = localStorage.getItem('token')
    return token ? { token } : null
}

export function fazerLogout() {
    localStorage.removeItem('token')
}

export function getUsuarioAtual() {
    const token = localStorage.getItem('token')
    if (!token) return null

    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload
    } catch {
        return null
    }
}
