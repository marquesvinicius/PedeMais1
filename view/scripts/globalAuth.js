// view/scripts/globalAuth.js
import * as apiAuth from './api/apiAuth.js'

document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logout-btn')

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                apiAuth.fazerLogout()
                window.location.href = '../../index.html'
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
