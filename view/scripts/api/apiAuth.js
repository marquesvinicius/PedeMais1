// view/scripts/api/apiAuth.js
import { BASE_URL } from '../config.js'

export async function login(email, senha) {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
    })

    const data = await response.json()

    if (!response.ok) throw new Error(data.erro || 'Erro no login')

    localStorage.setItem('token', data.token)
    return data
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
