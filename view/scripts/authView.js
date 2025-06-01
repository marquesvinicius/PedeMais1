// view/scripts/authView.js
import * as apiAuth from '../scripts/api/apiAuth.js'

document.addEventListener('DOMContentLoaded', () => {
  // Elementos do DOM
  const loginForm = document.getElementById('loginForm')
  const emailInput = document.getElementById('emailInput')
  const passwordInput = document.getElementById('passwordInput')
  const rememberCheck = document.getElementById('rememberCheck')
  const loginBtn = document.getElementById('loginBtn')
  const emailError = document.getElementById('emailError')
  const passwordError = document.getElementById('passwordError')
  const alertContainer = document.getElementById('alertContainer')
  const loginStatus = document.getElementById('loginStatus')

  // Verificar se já está logado
  checkAuthState()

  // Carregar último email se "lembrar login" estiver ativo
  loadRememberedData()

  // Event listener para mudanças no checkbox
  if (rememberCheck) {
    rememberCheck.addEventListener('change', updateLoginStatus)
  }

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
      await handleLogout()
    })
  }

  // Configurar nome do usuário no menu (se o elemento existir)
  setupUserInfo()

  // Funções
  async function checkAuthState() {
    try {
      // Verificar se acabou de fazer logout (flag temporária)
      const logoutRecente = sessionStorage.getItem('logoutRecente')
      if (logoutRecente) {
        // Remover flag e não fazer auto-login
        sessionStorage.removeItem('logoutRecente')
        return
      }
      
      const session = await apiAuth.verificarAutenticacao()
      
      // Verificar se está na página de login (index.html ou raiz do site)
      const isLoginPage = window.location.pathname.includes('index.html') || 
                         window.location.pathname === '/' || 
                         window.location.pathname.endsWith('/') ||
                         window.location.pathname === ''
      
      if (session && isLoginPage) {
        // Usuário já está logado, redirecionar para a página de pedidos
        const isLembrado = apiAuth.isLembrarLoginAtivo()
        
        const mensagem = isLembrado 
          ? 'Login lembrado ativo! Redirecionando...' 
          : 'Bem-vindo de volta!'
        
        showAlert(mensagem, 'success')
        
        setTimeout(() => {
          window.location.href = './view/pages/pedidos.html'
        }, 1000)
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
    }
  }

  function loadRememberedData() {
    if (apiAuth.isLembrarLoginAtivo()) {
      const ultimoEmail = apiAuth.getUltimoEmail()
      const diasRestantes = apiAuth.getTempoRestanteLembrarLogin()
      
      if (ultimoEmail && emailInput) {
        emailInput.value = ultimoEmail
        rememberCheck.checked = true
        
        // Mostrar status na interface
        if (loginStatus) {
          loginStatus.innerHTML = `Login salvo para ${ultimoEmail.split('@')[0]} (${diasRestantes} dias)`
          loginStatus.className = 'text-success'
        }
        
        // Mostrar informação sobre o login lembrado
        showAlert(
          `Bem-vindo de volta! Login lembrado para ${ultimoEmail}. Expira em ${diasRestantes} dias.`, 
          'info'
        )
      }
    } else {
      // Mostrar status quando não há login lembrado
      if (loginStatus) {
        loginStatus.innerHTML = 'Nenhum login salvo'
        loginStatus.className = 'text-muted'
      }
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
    const lembrarLogin = rememberCheck.checked

    // Validação básica
    if (!validarFormulario(email, password)) return

    // Mostrar loading no botão
    loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Entrando...'
    loginBtn.disabled = true

    try {
      // Tentativa de login com opção de lembrar
      await apiAuth.login(email, password, lembrarLogin)

      // Login bem-sucedido
      const mensagem = lembrarLogin 
        ? 'Login realizado com sucesso! Suas credenciais foram salvas por 30 dias.'
        : 'Login realizado com sucesso!'
      
      showAlert(mensagem, 'success')

      // Redirecionar para a página de pedidos após login
      setTimeout(() => {
        window.location.href = './view/pages/pedidos.html'
      }, 1500)

    } catch (error) {
      console.error('Erro ao fazer login:', error)
      showAlert('Falha ao fazer login. Verifique suas credenciais.', 'danger')
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Entrar'
      loginBtn.disabled = false
    }
  }

  async function handleLogout() {
    try {
      // Verificar se deve esquecer o login
      const esquecerLogin = confirm(
        'Deseja esquecer suas credenciais salvas?\n\n' +
        'Clique "OK" para fazer logout completo\n' +
        'Clique "Cancelar" para manter login lembrado'
      )
      
      await apiAuth.fazerLogout(esquecerLogin)
      
      const mensagem = esquecerLogin 
        ? 'Logout realizado e credenciais esquecidas.'
        : 'Logout realizado. Suas credenciais foram mantidas.'
      
      showAlert(mensagem, 'success')
      
      setTimeout(() => {
        window.location.href = '../../index.html'
      }, 1000)
    } catch (error) {
      console.error('Falha ao fazer logout:', error)
      showAlert('Erro ao sair do sistema. Tente novamente.', 'danger')
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

    // Auto-remover após 5 segundos (ou 7 para mensagens de sucesso)
    const timeout = type === 'success' ? 7000 : 5000
    setTimeout(() => {
      alert.classList.remove('show')
      setTimeout(() => {
        alert.remove()
      }, 150)
    }, timeout)
  }

  function updateLoginStatus() {
    const loginStatus = document.getElementById('loginStatus')
    if (!loginStatus) return
    
    if (rememberCheck.checked) {
      loginStatus.innerHTML = 'Login será salvo por 30 dias'
      loginStatus.className = 'text-primary'
    } else {
      if (apiAuth.isLembrarLoginAtivo()) {
        const ultimoEmail = apiAuth.getUltimoEmail()
        const diasRestantes = apiAuth.getTempoRestanteLembrarLogin()
        loginStatus.innerHTML = `Login salvo para ${ultimoEmail.split('@')[0]} (${diasRestantes} dias)`
        loginStatus.className = 'text-success'
      } else {
        loginStatus.innerHTML = 'Login apenas para esta sessão'
        loginStatus.className = 'text-muted'
      }
    }
  }
})