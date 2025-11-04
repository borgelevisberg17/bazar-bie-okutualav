import { protectPage } from './auth-guard.js';
import { getSession } from './auth.js';
import { api } from './services/api.js';

document.addEventListener('DOMContentLoaded', () => {
    const protectedRoutes = ['/profile.html', '/settings.html', '/favorites.html', '/messages.html', '/upload.html', '/checkout.html', '/seller.html'];
    protectPage(protectedRoutes);

    const session = getSession();
    const pageContent = document.getElementById('profile-page-content');

    if (!session) {
        // Authguard should handle this, but as a fallback
        pageContent.innerHTML = '<p>Você precisa estar logado para ver esta página.</p>';
        return;
    }

    const renderProfile = (user) => {
        const profileHTML = `
            <section class="profile-header">
                <div class="profile-avatar-container">
                    <img src="${user.avatar_url || 'assets/images/placeholders/avatar.png'}" alt="User Avatar" class="profile-avatar">
                </div>
                <div class="profile-info">
                    <h1 class="profile-name">${user.name}</h1>
                    <p class="profile-username">@${user.username || 'username'}</p>
                    <p class="profile-bio">${user.bio || 'Edite seu perfil para adicionar uma bio.'}</p>
                    <div class="profile-stats">
                        <div class="stat"><strong>${user.products_count || 0}</strong><span>Produtos</span></div>
                        <div class="stat"><strong>${user.followers_count || 0}</strong><span>Seguidores</span></div>
                        <div class="stat"><strong>${user.following_count || 0}</strong><span>Seguindo</span></div>
                    </div>
                    <div class="profile-actions">
                        <a href="/settings.html" class="btn btn-secondary">Editar Perfil</a>
                    </div>
                </div>
            </section>
            <section class="profile-tabs-container">
                <div class="profile-tabs">
                    <button class="tab-link active" data-tab="products">Meus Produtos</button>
                    <button class="tab-link" data-tab="favorites">Favoritos</button>
                </div>
                <div id="products" class="tab-content active">
                    <div class="products-grid" id="user-products-grid"></div>
                </div>
                <div id="favorites" class="tab-content">
                     <div class="products-grid" id="user-favorites-grid"></div>
                </div>
            </section>
        `;
        pageContent.innerHTML = profileHTML;
        loadUserProducts(user.id);
        addTabListeners();
    };

    const loadUserProducts = async (userId) => {
        try {
            // This is a placeholder for a real API call
            const grid = document.getElementById('user-products-grid');
            grid.innerHTML = '<p>Você ainda não publicou nenhum produto.</p>';
        } catch (error) {
            console.error('Failed to load user products:', error);
        }
    };

    const addTabListeners = () => {
        const tabs = document.querySelectorAll('.tab-link');
        const contents = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab).classList.add('active');
            });
        });
    };

    // Initial render
    renderProfile(session.user);
});
