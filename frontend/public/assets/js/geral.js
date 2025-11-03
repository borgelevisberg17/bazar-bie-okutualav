document.addEventListener("DOMContentLoaded", () => {
    const loadComponent = async (url, elementId) => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
            }
            const text = await response.text();
            const element = document.getElementById(elementId);
            if (element) {
                element.innerHTML = text;
            } else {
                console.warn(`Element with ID '${elementId}' not found.`);
            }
        } catch (error) {
            console.error(`Error loading component from ${url}:`, error);
        }
    };

    const setupHeader = () => {
        // Mobile Menu
        const mobileNavToggle = document.getElementById('mobile-nav-toggle');
        const mobileSideMenu = document.getElementById('mobile-side-menu');
        const closeMenuBtn = document.getElementById('close-menu-btn');
        const overlay = document.getElementById('overlay');

        if (mobileNavToggle && mobileSideMenu && closeMenuBtn && overlay) {
            mobileNavToggle.addEventListener('click', () => {
                mobileSideMenu.classList.add('open');
                overlay.classList.add('visible');
                document.body.classList.add('no-scroll');
            });
            const closeMenu = () => {
                mobileSideMenu.classList.remove('open');
                overlay.classList.remove('visible');
                document.body.classList.remove('no-scroll');
            };
            closeMenuBtn.addEventListener('click', closeMenu);
            overlay.addEventListener('click', closeMenu);
        }

        // Cart Icon
        const cartBtn = document.getElementById('cart-btn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                window.location.href = '/checkout.html';
            });
        }

        // Search Overlay
        const searchBtn = document.getElementById('search-btn');
        const searchOverlay = document.getElementById('search-overlay');
        const closeSearchBtn = document.getElementById('close-search-btn');
        const searchInput = document.getElementById('search-input');

        if (searchBtn && searchOverlay && closeSearchBtn) {
            searchBtn.addEventListener('click', () => {
                searchOverlay.classList.add('open');
                searchInput.focus();
            });

            closeSearchBtn.addEventListener('click', () => {
                searchOverlay.classList.remove('open');
            });
        }

        // User Profile & Logout
        const userSession = JSON.parse(localStorage.getItem('user_session'));
        const profileAvatar = document.querySelector('.profile-avatar');
        const logoutBtn = document.getElementById('logout-btn');

        if (userSession && profileAvatar) {
            profileAvatar.src = userSession.user.avatar_url || '/assets/images/placeholders/avatar.png';
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('user_session');
                // You might want to also call an API endpoint to invalidate the token on the server
                window.location.href = '/auth/login.html';
            });
        }
    };

    const init = async () => {
        await loadComponent('/common/header.html', 'mainHeader');
        await loadComponent('/common/footer.html', 'mainFooter');
        setupHeader(); // Setup all header functionality
    };

    init();
});
