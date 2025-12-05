import { login } from './services/api.js';
import { setSession } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const session = await login(email, password);
                setSession(session);
                window.location.href = '/admin/index.html';
            } catch (error) {
                console.error('Login failed:', error);
                // You can add a user-facing error message here
            }
        });
    }
});