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

    const setupFAQToggle = () => {
        const faqItems = document.querySelectorAll('.faq-item');
        if (!faqItems.length) return;

        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');

                // Close all other items before toggling
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });

                // Toggle the clicked item
                item.classList.toggle('active');
            });
        });
    };

    const init = async () => {
        const headerPlaceholder = document.getElementById('header-placeholder');
        const footerPlaceholder = document.getElementById('footer-placeholder');

        if (headerPlaceholder) {
            await loadComponent('/common/header.html', 'header-placeholder');
            setupDesktopHeader();
        }

        if (footerPlaceholder) {
            await loadComponent('/common/footer.html', 'footer-placeholder');
        }

        // Setup mobile navigation if placeholder exists
        const bottomNav = document.getElementById('bottomNav');
        if (bottomNav) {
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

        setupFAQToggle();
        setupMobileMenu();
    };

    const setupMobileMenu = () => {
        const hamburgerBtn = document.getElementById('hamburger-btn');
        const mobileSidebar = document.getElementById('mobile-sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        const body = document.body;

        if (hamburgerBtn && mobileSidebar && sidebarOverlay) {
            hamburgerBtn.addEventListener('click', () => {
                mobileSidebar.classList.toggle('open');
                sidebarOverlay.classList.toggle('open');
                body.style.overflow = mobileSidebar.classList.contains('open') ? 'hidden' : '';
            });

            sidebarOverlay.addEventListener('click', () => {
                mobileSidebar.classList.remove('open');
                sidebarOverlay.classList.remove('open');
                body.style.overflow = '';
            });
        }
    };

    init();
});
