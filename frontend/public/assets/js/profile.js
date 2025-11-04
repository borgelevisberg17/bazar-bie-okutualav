import { getSession } from './auth.js';
import { getProductsBySeller } from './services/api.js';
import { showToast } from './notifications.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = getSession()?.user;
    const pageContent = document.getElementById('profile-page-content');

    if (!user) {
        window.location.href = '/auth/login.html';
        return;
    }

    const renderProfile = () => {
        document.title = `Meu Perfil - ${user.name} - Bazar Bié Okutuala`;

        const profileHTML = `
            <div class="profile-layout">
                <aside class="profile-sidebar">
                    <div class="profile-avatar-container">
                        <img src="${user.avatar_url || 'assets/images/placeholders/avatar.png'}" alt="User Avatar" class="profile-avatar">
                        <h2 class="profile-name">${user.name}</h2>
                        <p class="profile-email">${user.email}</p>
                    </div>
                    <nav class="profile-nav">
                        <a href="/profile.html" class="nav-item active"><i class="fas fa-user-circle"></i> Meu Perfil</a>
                        <a href="/favorites.html" class="nav-item"><i class="fas fa-heart"></i> Favoritos</a>
                        <a href="/messages.html" class="nav-item"><i class="fas fa-envelope"></i> Mensagens</a>
                        <a href="/settings.html" class="nav-item"><i class="fas fa-cog"></i> Configurações</a>
                    </nav>
                </aside>
                <main class="profile-main-content">
                    <section id="my-products-section">
                        <h3>Meus Produtos</h3>
                        <div class="products-grid" id="my-products-grid"></div>
                    </section>
                </main>
            </div>
        `;
        pageContent.innerHTML = profileHTML;
    };

    const renderProducts = (products) => {
        const productsGrid = document.getElementById('my-products-grid');
        if (!productsGrid) return;

        if (products.length === 0) {
            productsGrid.innerHTML = '<p>Você ainda não publicou nenhum produto.</p>';
            return;
        }

        const productsHTML = products.map(product => {
             const priceFormatted = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price);
            return `
                <div class="product-card">
                    <a href="/product.html?id=${product.id}" class="product-card__image-container">
                        <img src="${product.image_url || 'assets/images/placeholders/product.png'}" alt="${product.name}" class="product-card__image">
                    </a>
                    <div class="product-card__content">
                        <a href="/product.html?id=${product.id}" class="product-card__title">${product.name}</a>
                        <p class="product-card__price">${priceFormatted}</p>
                    </div>
                </div>
            `;
        }).join('');
        productsGrid.innerHTML = productsHTML;
    };

    const loadUserProducts = async () => {
        try {
            const response = await getProductsBySeller(user.id);
            renderProducts(response.data);
        } catch (error) {
            showToast('Erro ao carregar os seus produtos.', 'error');
        }
    };

    renderProfile();
    if (user.role === 'seller') {
        loadUserProducts();
    }
});
