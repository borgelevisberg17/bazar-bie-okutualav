document.addEventListener("DOMContentLoaded", () => {
    const loadComponent = async (url, elementId) => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch ${url}`);
            const text = await response.text();
            const element = document.getElementById(elementId);
            if (element) element.innerHTML = text;
        } catch (error) {
            console.error(`Error loading component:`, error);
        }
    };

    const setupDesktopHeader = () => {
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
                window.location.href = '/auth/login.html';
            });
        }
    };

    const setActiveNavIcon = () => {
        const currentPath = window.location.pathname;
        const navIcons = document.querySelectorAll('.nav-icon');

        navIcons.forEach(icon => {
            const iconPath = icon.getAttribute('href');
            icon.classList.remove('active');
            if (currentPath === iconPath || (currentPath === '/' && iconPath === '/')) {
                icon.classList.add('active');
            }
        });
    };

    const init = async () => {
        // Load header for desktop, and bottom nav for mobile
        // The display is controlled by CSS media queries
        const mainHeader = document.getElementById('mainHeader');
        const bottomNav = document.getElementById('bottomNav');
        const mainFooter = document.getElementById('mainFooter');

        if(mainHeader) {
            await loadComponent('/common/header.html', 'mainHeader');
            setupDesktopHeader();
        }

        if(mainFooter) {
            await loadComponent('/common/footer.html', 'mainFooter');
        }

        if(bottomNav){
            // As header.html now contains the bottom nav, we can source it from there.
            // A better approach would be separate files, but for now this works.
            const response = await fetch('/common/header.html');
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            const mobileNavContent = doc.querySelector('.bottom-nav');
            if (mobileNavContent) {
                bottomNav.innerHTML = mobileNavContent.innerHTML;
                setActiveNavIcon();
            }
        }
    };

    init();
});
