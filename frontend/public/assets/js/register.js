import { register } from './services/api.js';
import { showToast } from './notifications.js';
import { setSession } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = registerForm.name.value;
        const email = registerForm.email.value;
        const password = registerForm.password.value;
        const passwordConfirmation = registerForm.password_confirmation.value;

        if (password !== passwordConfirmation) {
            showToast('As senhas não coincidem.', 'error');
            return;
        }

        try {
            const response = await register(name, email, password);
            setSession(response.data);
            showToast('Registro bem-sucedido!', 'success');
            window.location.href = '/';
        } catch (error) {
            showToast('Erro ao criar conta. Tente novamente.', 'error');
        }
    });
});
