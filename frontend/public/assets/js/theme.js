import { getSession } from './auth.js';

function updateUserUI() {
    const session = getSession();
    const userProfileElements = document.querySelectorAll('.user-profile');
    const sellButton = document.querySelector('.menu-cta-button');
    const cartBadge = document.querySelector('.cart-badge');

    if (session && session.user) {
        const { user } = session;
        userProfileElements.forEach(element => {
            element.innerHTML = `
                <i class="fa-regular fa-user"></i>
                <div class="action-text">
                    <span>Olá, ${user.name.split(' ')[0]}!</span>
                    <strong><a href="/profile.html" style="color: inherit; text-decoration: none;">Minha Conta</a></strong>
                </div>
            `;
        });

        if (sellButton) {
            sellButton.textContent = 'Minha Loja';
            sellButton.href = '/seller.html';
        }

        if (cartBadge) {
            // TODO: Fetch the actual cart count from the API
            let cartCount = 0; // Simulated cart count
            cartBadge.textContent = cartCount;
            cartBadge.style.display = cartCount > 0 ? 'block' : 'none';
        }

    } else {
        userProfileElements.forEach(element => {
            element.innerHTML = `
                <i class="fa-regular fa-user"></i>
                <div class="action-text">
                    <span>Olá, faça seu login</span>
                    <strong><a href="/auth/login.html" style="color: inherit; text-decoration: none;">Minha conta</a></strong>
                </div>
            `;
        });

        if (sellButton) {
            sellButton.textContent = 'Vender Agora';
            sellButton.href = '/auth/login.html';
        }

        if (cartBadge) {
            cartBadge.style.display = 'none';
        }
    }
}

function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        });
    }

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
}


document.addEventListener('DOMContentLoaded', () => {
    updateUserUI();
    initTheme();
});
