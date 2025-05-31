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
        const token = apiAuth.verificarAutenticacao()
        if (!token) {
            window.location.href = '../../index.html'
        }
    }
})
