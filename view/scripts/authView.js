// view/scripts/authView.js
import * as apiAuth from '../scripts/api/apiAuth.js'

document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM
  const loginForm = document.getElementById('loginForm')
  const emailInput = document.getElementById('emailInput')
  const passwordInput = document.getElementById('passwordInput')
  const loginBtn = document.getElementById('loginBtn')
  const emailError = document.getElementById('emailError')
  const passwordError = document.getElementById('passwordError')
  const alertContainer = document.getElementById('alertContainer')

  // Verificar se já está logado
  checkAuthState()

  // Event listener para o formulário de login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      await handleLogin()
    })
  }

  // Adicionar event listener para logout se existir o botão
  const logoutBtn = document.getElementById('logout-btn')
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault()
      try {
        await apiAuth.fazerLogout()
        window.location.href = '../../index.html'
      } catch (error) {
        console.error('Falha ao fazer logout:', error)
        showAlert('Erro ao sair do sistema. Tente novamente.', 'danger')
      }
    })
  }

  // Configurar nome do usuário no menu (se o elemento existir)
  setupUserInfo()

  // Funções
  async function checkAuthState() {
    try {
      const session = await apiAuth.verificarAutenticacao()
      if (session && window.location.pathname.includes('index.html')) {
        // Usuário já está logado, redirecionar para a página de pedidos
        window.location.href = './view/pages/pedidos.html'
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
    }
  }

  async function setupUserInfo() {
    const nomeUsuarioEl = document.getElementById('nome-usuario')
    if (nomeUsuarioEl) {
      const usuario = await apiAuth.getUsuarioAtual()
      if (usuario) {
        nomeUsuarioEl.textContent = usuario.email.split('@')[0]
      }
    }
  }

  async function handleLogin() {
    // Limpar erros anteriores
    resetErrors()

    // Obter valores do formulário
    const email = emailInput.value.trim()
    const password = passwordInput.value

    // Validação básica
    if (!validarFormulario(email, password)) return

    // Mostrar loading no botão
    loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Entrando...'
    loginBtn.disabled = true

    try {
      // Tentativa de login
      await apiAuth.login(email, password)

      // Login bem-sucedido
      showAlert('Login realizado com sucesso!', 'success')

      // Redirecionar para a página de pedidos após login
      setTimeout(() => {
        window.location.href = './view/pages/pedidos.html'
      }, 1000)

    } catch (error) {
      console.error('Erro ao fazer login:', error)
      showAlert('Falha ao fazer login. Verifique suas credenciais.', 'danger')
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Entrar'
      loginBtn.disabled = false
    }
  }

  function validarFormulario(email, password) {
    let isValid = true

    if (!email) {
      showError(emailError, 'Por favor, informe seu email')
      isValid = false
    } else if (!isValidEmail(email)) {
      showError(emailError, 'Email inválido')
      isValid = false
    }

    if (!password) {
      showError(passwordError, 'Por favor, informe sua senha')
      isValid = false
    } else if (password.length < 6) {
      showError(passwordError, 'A senha deve ter pelo menos 6 caracteres')
      isValid = false
    }

    return isValid
  }

  // Funções auxiliares
  function resetErrors() {
    if (emailError) emailError.style.display = 'none'
    if (passwordError) passwordError.style.display = 'none'
  }

  function showError(element, message) {
    if (element) {
      element.textContent = message
      element.style.display = 'block'
    }
  }

  function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return re.test(email)
  }

  function showAlert(message, type) {
    if (!alertContainer) return

    const alert = document.createElement('div')
    alert.className = `alert alert-${type} alert-dismissible fade show`
    alert.role = 'alert'
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    `

    alertContainer.appendChild(alert)

    // Auto-remover após 5 segundos
    setTimeout(() => {
      alert.classList.remove('show')
      setTimeout(() => {
        alert.remove()
      }, 150)
    }, 5000)
  }
})