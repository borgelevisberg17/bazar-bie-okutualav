document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const googleSigninBtn = document.getElementById('google-signin');

    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        });
    }

    if (showLoginLink) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }

    /**
     * Handles the response from the authentication API.
     * @param {Object} data - The response data from the API.
     * @param {boolean} [success=true] - Whether the request was successful.
     */
    const handleAuthResponse = (data, success = true) => {
        if (success) {
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify({ uid: data.uid, name: data.name }));
            window.location.href = '../index.html';
        } else {
            alert(data.error);
        }
    };

    if (loginForm) {
        const loginFormElement = document.getElementById('loginForm');
        loginFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            try {
                const { user } = await auth.signInWithEmailAndPassword(email, password);
                const idToken = await user.getIdToken();
                // Replace with your actual API endpoint
                const response = await fetch('http://localhost:4000/api/auth/exchange', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken }),
                });
                const data = await response.json();
                handleAuthResponse(data, response.ok);
            } catch (error) {
                alert(error.message);
            }
        });
    }

    if (registerForm) {
        const registerFormElement = document.getElementById('registerForm');
        registerFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;

            try {
                const { user } = await auth.createUserWithEmailAndPassword(email, password);
                await user.updateProfile({ displayName: name });
                const idToken = await user.getIdToken();
                // Replace with your actual API endpoint
                const response = await fetch('http://localhost:4000/api/auth/exchange', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken }),
                });
                const data = await response.json();
                handleAuthResponse(data, response.ok);
            } catch (error) {
                alert(error.message);
            }
        });
    }

    if (googleSigninBtn) {
        googleSigninBtn.addEventListener('click', async () => {
            try {
                const { user } = await auth.signInWithPopup(googleProvider);
                const idToken = await user.getIdToken();
                // Replace with your actual API endpoint
                const response = await fetch('http://localhost:4000/api/auth/exchange', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken }),
                });
                const data = await response.json();
                handleAuthResponse(data, response.ok);
            } catch (error) {
                console.error('Google Sign-in error:', error);
                alert('An error occurred during Google Sign-in.');
            }
        });
    }
});
