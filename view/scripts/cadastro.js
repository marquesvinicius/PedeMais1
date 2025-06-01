import { BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, procurando elementos...');

    const form = document.getElementById('cadastroForm');
    if (!form) {
        console.error('Formulário não encontrado! Verifique se o ID "cadastroForm" existe no HTML.');
        return;
    }

    const senhaInput = document.getElementById('senha');
    const confirmarSenhaInput = document.getElementById('confirmarSenha');
    const tipoUsuarioInputs = document.querySelectorAll('input[name="tipoUsuario"]');

    console.log('Elementos encontrados:', {
        form: !!form,
        senhaInput: !!senhaInput,
        confirmarSenhaInput: !!confirmarSenhaInput,
        tipoUsuarioInputs: tipoUsuarioInputs.length
    });

    // Tornar todo o card clicável para selecionar tipo de usuário
    const roleCards = document.querySelectorAll('.role-card');
    roleCards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Previne que o clique no próprio radio button seja duplicado
            if (e.target.type === 'radio') return;
            
            // Encontra o radio button dentro do card
            const radioButton = card.querySelector('input[type="radio"]');
            if (radioButton) {
                radioButton.checked = true;
                
                // Remove a classe 'selected' de todos os cards
                roleCards.forEach(c => c.classList.remove('selected'));
                
                // Adiciona a classe 'selected' ao card clicado
                card.classList.add('selected');
            }
        });
        
        // Adiciona estilo de cursor pointer
        card.style.cursor = 'pointer';
    });

    // Adiciona event listener para mudanças nos radio buttons
    tipoUsuarioInputs.forEach(input => {
        input.addEventListener('change', () => {
            // Remove a classe 'selected' de todos os cards
            roleCards.forEach(card => card.classList.remove('selected'));
            
            // Adiciona a classe 'selected' ao card do radio button selecionado
            const selectedCard = input.closest('.role-card');
            if (selectedCard) {
                selectedCard.classList.add('selected');
            }
        });
    });

    // Função para mostrar notificações
    function mostrarNotificacao(mensagem, tipo = 'success') {
        // Cria o elemento toast
        const toastContainer = document.createElement('div');
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '11';

        toastContainer.innerHTML = `
            <div class="toast align-items-center text-white bg-${tipo} border-0" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        ${mensagem}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;

        document.body.appendChild(toastContainer);
        const toastElement = toastContainer.querySelector('.toast');
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 5000
        });

        toast.show();

        // Remove o elemento após ser escondido
        toastElement.addEventListener('hidden.bs.toast', () => {
            document.body.removeChild(toastContainer);
        });
    }

    // Validação do formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Formulário submetido');

        // Validação das senhas
        if (senhaInput.value !== confirmarSenhaInput.value) {
            console.log('Erro: Senhas não coincidem');
            mostrarNotificacao('As senhas não coincidem!', 'danger');
            return;
        }

        // Validação da força da senha
        if (senhaInput.value.length < 6) {
            console.log('Erro: Senha muito curta');
            mostrarNotificacao('A senha deve ter pelo menos 6 caracteres!', 'warning');
            return;
        }

        // Validação do tipo de usuário
        const tipoUsuarioSelecionado = document.querySelector('input[name="tipoUsuario"]:checked');
        if (!tipoUsuarioSelecionado) {
            console.log('Erro: Tipo de usuário não selecionado');
            mostrarNotificacao('Por favor, selecione o tipo de usuário!', 'warning');
            return;
        }

        // Coleta os dados do formulário
        const formData = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            senha: senhaInput.value,
            tipoUsuario: tipoUsuarioSelecionado.value
        };

        console.log('Dados do formulário coletados:', { ...formData, senha: '***' });

        // URL do servidor
        const apiUrl = `${BASE_URL}/api/usuarios/cadastro`;
        console.log('Tentando conexão com:', apiUrl);

        try {
            console.log('Enviando requisição para o servidor...');
            mostrarNotificacao('Processando seu cadastro...', 'info');

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            console.log('Resposta recebida do servidor:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            let data = {};
            try {
                data = await response.json();
                console.log('Resposta do servidor recebida:', {
                    status: response.status,
                    ok: response.ok,
                    data: { ...data, token: data.token ? '***' : undefined }
                });
            } catch (jsonError) {
                console.error('Erro ao processar resposta JSON:', jsonError);
                mostrarNotificacao('O servidor retornou uma resposta inválida.', 'danger');
                return;
            }

            if (response.ok) {
                // Armazena o token e o tipo de usuário no localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('tipoUsuario', data.usuario.papel);
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                
                console.log('Usuário cadastrado com sucesso, redirecionando...');
                mostrarNotificacao('Cadastro realizado com sucesso! Redirecionando...', 'success');
                
                // Para garantir que funcione em qualquer ambiente
                const baseUrl = window.location.origin;
                setTimeout(() => {
                    window.location.href = `${baseUrl}/view/pages/pedidos.html`;
                }, 2000);
            } else {
                console.log('Erro no cadastro:', data.message);
                mostrarNotificacao(data.message || 'Erro ao realizar cadastro. Tente novamente.', 'danger');
            }
        } catch (error) {
            console.error('Erro na requisição:', error);
            mostrarNotificacao('Erro ao conectar com o servidor. Tente novamente mais tarde.', 'danger');
        }
    });
}); 