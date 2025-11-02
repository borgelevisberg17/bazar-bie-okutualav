import { showToast } from './notifications.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const googleSigninBtn = document.querySelector('.btn-social-google');

    // Firebase is loaded from a script tag in the HTML
    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = registerForm.querySelector('input[name="name"]').value;
            const email = registerForm.querySelector('input[name="email"]').value;
            const password = registerForm.querySelector('input[name="password"]').value;

            try {
                const { user } = await auth.createUserWithEmailAndPassword(email, password);
                await user.updateProfile({ displayName: name });
                showToast('Registo bem-sucedido! Por favor, faça login.', 'success');
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }

    if (googleSigninBtn) {
        googleSigninBtn.addEventListener('click', async () => {
            try {
                const { user } = await auth.signInWithPopup(googleProvider);
                const idToken = await user.getIdToken();

                const response = await fetch('http://localhost:4000/api/auth/exchange', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken }),
                });

                if (response.ok) {
                    const sessionData = await response.json();
                    localStorage.setItem('user_session', JSON.stringify(sessionData));
                    window.location.href = '../index.html';
                } else {
                    const error = await response.json();
                    showToast(error.message, 'error');
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.querySelector('input[name="email"]').value;
            const password = loginForm.querySelector('input[name="password"]').value;

            try {
                const { user } = await auth.signInWithEmailAndPassword(email, password);
                const idToken = await user.getIdToken();

                // Exchange Firebase token for our own token
                const response = await fetch('http://localhost:4000/api/auth/exchange', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken }),
                });

                if (response.ok) {
                    const sessionData = await response.json();
                    localStorage.setItem('user_session', JSON.stringify(sessionData));
                    window.location.href = '../index.html';
                } else {
                    const error = await response.json();
                    showToast(error.message, 'error');
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }
});
