document.addEventListener('DOMContentLoaded', () => {
    // Referências aos formulários
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');

    // Manipula o formulário de CADASTRO
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            // Linha crucial para impedir o recarregamento padrão da página
            e.preventDefault(); 
            
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                // 1. Verifica se o usuário já existe
                const checkResponse = await fetch(`http://localhost:3000/users?email=${email}`);
                const existingUsers = await checkResponse.json();

                if (existingUsers.length > 0) {
                    alert('Este e-mail já está cadastrado.');
                    return; // Para a execução aqui
                }

                // 2. Se não existe, cria o novo usuário
                const response = await fetch('http://localhost:3000/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                // 3. Se a criação foi bem-sucedida
                if (response.ok) {
                    alert('Cadastro realizado com sucesso! Você será redirecionado para o login.');
                    
                    // 4. Redireciona para a página de login
                    window.location.href = 'login.html';
                } else {
                    // Se a API retornar um erro
                    throw new Error('Erro ao cadastrar. Tente novamente.');
                }
            } catch (error) {
                // Se houver um erro de rede ou na API
                alert(error.message);
                console.error('Falha no cadastro:', error);
            }
        });
    }

    // Manipula o formulário de LOGIN
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede o recarregamento aqui também
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch(`http://localhost:3000/users?email=${email}&password=${password}`);
                const users = await response.json();

                if (users.length === 1) {
                    localStorage.setItem('loggedInUser', JSON.stringify(users[0]));
                    alert('Login realizado com sucesso!');
                    window.location.href = 'index.html';
                } else {
                    alert('E-mail ou senha incorretos.');
                }
            } catch (error) {
                alert('Ocorreu um erro ao tentar fazer login.');
                console.error('Falha no login:', error);
            }
        });
    }
});