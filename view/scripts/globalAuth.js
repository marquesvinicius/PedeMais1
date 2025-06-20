// view/scripts/globalAuth.js
import * as apiAuth from './api/apiAuth.js'

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn')

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                // Verificar se há login lembrado ativo
                const temLoginLembrado = apiAuth.isLembrarLoginAtivo()
                let esquecerLogin = false
                
                if (temLoginLembrado) {
                    const ultimoEmail = apiAuth.getUltimoEmail()
                    const diasRestantes = apiAuth.getTempoRestanteLembrarLogin()
                    
                    esquecerLogin = confirm(
                        `Você tem login lembrado para ${ultimoEmail} (${diasRestantes} dias restantes).\n\n` +
                        'Deseja esquecer suas credenciais salvas?\n\n' +
                        'OK = Logout completo (esquecer credenciais)\n' +
                        'Cancelar = Logout simples (manter credenciais)'
                    )
                }
                
                await apiAuth.fazerLogout(esquecerLogin)
                
                // Marcar que foi feito logout recente para evitar auto-login
                sessionStorage.setItem('logoutRecente', 'true')
                
                // Forçar limpeza adicional de qualquer token remanescente
                localStorage.removeItem('token')
                sessionStorage.removeItem('token')
                
                // Mostrar mensagem de feedback
                if (temLoginLembrado) {
                    const mensagem = esquecerLogin 
                        ? 'Logout realizado e credenciais esquecidas.'
                        : 'Logout realizado. Suas credenciais foram mantidas.'
                    
                    // Criar alerta temporário
                    const alert = document.createElement('div')
                    alert.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3'
                    alert.style.zIndex = '9999'
                    alert.textContent = mensagem
                    document.body.appendChild(alert)
                    
                    setTimeout(() => alert.remove(), 2000)
                }
                
                setTimeout(() => {
                    window.location.href = '../../index.html'
                }, temLoginLembrado ? 2000 : 500)
                
            } catch (err) {
                console.error('Erro ao sair:', err)
                alert('Erro ao sair. Tente novamente.')
            }
        })
    }

    // Se a página exigir login, adicione o atributo data-requer-auth no body
    const requerAuth = document.body.dataset.requerAuth === 'true'

    if (requerAuth) {
        // Verificar se é um cadastro recente para evitar redirecionamento indevido
        const cadastroRecente = sessionStorage.getItem('cadastroRecente')
        const logoutRecente = sessionStorage.getItem('logoutRecente')
        
        if (cadastroRecente) {
            // Limpar a flag de cadastro recente
            sessionStorage.removeItem('cadastroRecente')
            return // Não verificar autenticação neste caso
        }
        
        if (logoutRecente) {
            // Limpar a flag de logout recente
            sessionStorage.removeItem('logoutRecente')
            window.location.href = '../../index.html'
            return
        }
        
        // Verificar se há algum token (válido ou inválido)
        const temToken = sessionStorage.getItem('token') || localStorage.getItem('token')
        
        if (!temToken) {
            // Só redireciona se não há token algum
            window.location.href = '../../index.html'
        } else {
            // Se há token, verificar se é válido
            const authData = apiAuth.verificarAutenticacao()
            if (!authData) {
                // Token inválido ou expirado - redirecionar
                window.location.href = '../../index.html'
            }
            // Se token é válido, deixar a página carregar normalmente
            // As funcionalidades individuais verificarão o papel do usuário
        }
    }
})
