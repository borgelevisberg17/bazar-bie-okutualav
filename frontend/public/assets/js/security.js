document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        window.location.href = '/auth/login.html';
        return;
    }

    const setupBtn = document.getElementById('setup-2fa-btn');
    const verifyBtn = document.getElementById('verify-2fa-btn');
    const disableBtn = document.getElementById('disable-2fa-btn');
    const qrCodeContainer = document.getElementById('qr-code-container');
    const qrCodeImg = document.getElementById('qr-code');
    const otpInput = document.getElementById('otp-input');
    const statusDiv = document.getElementById('2fa-status');

    let secret = '';

    /**
     * Fetches the user's 2FA status and updates the UI accordingly.
     */
    async function check2FAStatus() {
        try {
            const res = await fetch('/api/users/me', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const user = await res.json();
            if (user.two_factor_enabled) {
                statusDiv.textContent = '2FA is currently enabled on your account.';
                setupBtn.style.display = 'none';
                disableBtn.style.display = 'block';
            } else {
                statusDiv.textContent = '2FA is currently disabled on your account.';
            }
        } catch (err) {
            console.error('Error fetching user status:', err);
        }
    }

    /**
     * Sets up 2FA by fetching a QR code and secret from the server.
     */
    async function setup2FA() {
        try {
            const res = await fetch('/api/auth/setup-2fa', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            secret = data.secret;
            qrCodeImg.src = data.qrCodeUrl;
            qrCodeContainer.style.display = 'block';
            setupBtn.style.display = 'none';
        } catch (err) {
            console.error('Error setting up 2FA:', err);
        }
    }

    /**
     * Verifies the OTP token entered by the user.
     */
    async function verify2FA() {
        const token = otpInput.value;
        try {
            const res = await fetch('/api/auth/verify-2fa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ token })
            });
            const data = await res.json();
            if (data.success) {
                alert('2FA enabled successfully!');
                window.location.reload();
            } else {
                alert('Invalid token, please try again.');
            }
        } catch (err) {
            console.error('Error verifying 2FA:', err);
        }
    }

    /**
     * Disables 2FA for the user.
     */
    async function disable2FA() {
        try {
            const res = await fetch('/api/auth/disable-2fa', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await res.json();
            if (data.success) {
                alert('2FA disabled successfully!');
                window.location.reload();
            } else {
                alert('Failed to disable 2FA.');
            }
        } catch (err) {
            console.error('Error disabling 2FA:', err);
        }
    }

    check2FAStatus();
    setupBtn.addEventListener('click', setup2FA);
    verifyBtn.addEventListener('click', verify2FA);
    disableBtn.addEventListener('click', disable2FA);
});
