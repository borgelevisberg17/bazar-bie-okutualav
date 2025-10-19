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

    // Check 2FA status
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

    setupBtn.addEventListener('click', async () => {
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
    });

    verifyBtn.addEventListener('click', async () => {
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
    });

    disableBtn.addEventListener('click', async () => {
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
    });
});
