document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const googleSigninBtn = document.querySelector('.btn-social[aria-label="Entrar com Google"]');
    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    /**
     * Displays an error message for a form field.
     * @param {string} elementId - The ID of the error message element.
     * @param {string} message - The error message to display.
     */
    const displayError = (elementId, message) => {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
        }
    };

    /**
     * Clears all error messages from the forms.
     */
    const clearErrors = () => {
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    };

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
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearErrors();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            if (!email) return displayError('loginEmailError', 'Email is required.');
            if (!password) return displayError('loginPasswordError', 'Password is required.');

            try {
                const { user } = await auth.signInWithEmailAndPassword(email, password);
                const idToken = await user.getIdToken();
                const response = await fetch(`${API_URL}/auth/exchange`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken }),
                });
                const data = await response.json();
                handleAuthResponse(data, response.ok);
            } catch (error) {
                displayError('loginPasswordError', error.message);
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearErrors();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                return displayError('confirmPasswordError', 'Passwords do not match.');
            }

            try {
                const { user } = await auth.createUserWithEmailAndPassword(email, password);
                await user.updateProfile({ displayName: name });
                const idToken = await user.getIdToken();
                const response = await fetch(`${API_URL}/auth/exchange`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken }),
                });
                const data = await response.json();
                handleAuthResponse(data, response.ok);
            } catch (error) {
                displayError('registerPasswordError', error.message);
            }
        });
    }

    if (googleSigninBtn) {
        googleSigninBtn.addEventListener('click', async () => {
            try {
                const { user } = await auth.signInWithPopup(googleProvider);
                const idToken = await user.getIdToken();
                const response = await fetch(`${API_URL}/auth/exchange`, {
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
