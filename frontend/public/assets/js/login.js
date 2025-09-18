document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const googleSigninBtn = document.querySelector('.btn-social[aria-label="Entrar com Google"]');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });
                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('accessToken', data.accessToken);
                    localStorage.setItem('refreshToken', data.refreshToken);
                    localStorage.setItem('user', JSON.stringify({ uid: data.uid, name: data.name }));
                    window.location.href = '../index.html';
                } else {
                    alert(data.error);
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('An error occurred during login.');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;

            try {
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password }),
                });
                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('accessToken', data.accessToken);
                    localStorage.setItem('refreshToken', data.refreshToken);
                    localStorage.setItem('user', JSON.stringify({ uid: data.uid, name: data.name }));
                    window.location.href = '../index.html';
                } else {
                    alert(data.error);
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('An error occurred during registration.');
            }
        });
    }
    const auth = firebase.auth();
    const googleProvider = new firebase.auth.GoogleAuthProvider();

    if (googleSigninBtn) {
        googleSigninBtn.addEventListener('click', async () => {
            try {
                const result = await auth.signInWithPopup(googleProvider);
                const idToken = await result.user.getIdToken();

                const response = await fetch(`${API_URL}/auth/exchange`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idToken }),
                });

                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('accessToken', data.accessToken);
                    localStorage.setItem('refreshToken', data.refreshToken);
                    localStorage.setItem('user', JSON.stringify({ uid: data.uid, name: result.user.displayName }));
                    window.location.href = '../index.html';
                } else {
                    alert(data.error);
                }
            } catch (error) {
                console.error('Google Sign-in error:', error);
                alert('An error occurred during Google Sign-in.');
            }
        });
    }
});
