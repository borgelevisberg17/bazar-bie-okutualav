import { showToast } from './notifications.js';
import { getMyProfile, getProductsByUser, getFavoriteProducts } from './services/api.js';
import { getUserSession } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const profileName = document.getElementById('profile-name');
    const profileBio = document.getElementById('profile-bio');
    const profileAvatar = document.getElementById('profile-avatar');
    const productsStat = document.querySelector('.profile-stats .stat:nth-child(1) strong');
    const followersStat = document.querySelector('.profile-stats .stat:nth-child(2) strong');
    const followingStat = document.querySelector('.profile-stats .stat:nth-child(3) strong');
    const editProfileBtn = document.getElementById('edit-profile-btn');

    const tabs = document.querySelectorAll('.profile-tabs .tab-link');
    const tabContents = document.querySelectorAll('.profile-content .tab-content');
    const productsGrid = document.getElementById('products-grid');
    const favoritesGrid = document.getElementById('favorites-grid');

    const currentUser = getUserSession()?.user;

    if (!currentUser) {
        window.location.href = '/auth/login.html';
        return;
    }

    const renderProfile = (user) => {
        profileName.textContent = user.name;
        profileBio.textContent = user.bio || 'Adicione uma bio no seu perfil.';
        profileAvatar.src = user.avatar_url || 'assets/images/placeholders/user-avatar.png';
        productsStat.textContent = user.products_count || 0;
        followersStat.textContent = user.followers_count || 0;
        followingStat.textContent = user.following_count || 0;
    };

    const renderProducts = (products, gridElement) => {
        gridElement.innerHTML = '';
        if (!products || products.length === 0) {
            gridElement.innerHTML = '<p class="empty-state-text">Nenhum produto para mostrar.</p>';
            return;
        }

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            const imageUrl = product.images && product.images.length > 0 ? product.images[0].image_url : 'assets/images/placeholders/product.png';
            const priceFormatted = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price);

            productCard.innerHTML = `
                <a href="product.html?id=${product.id}" class="product-image-link">
                    <img src="${imageUrl}" alt="${product.name}" class="product-image">
                </a>
                <div class="product-info">
                    <a href="product.html?id=${product.id}">
                        <h3 class="product-title">${product.name}</h3>
                    </a>
                    <p class="product-price">${priceFormatted}</p>
                </div>
            `;
            gridElement.appendChild(productCard);
        });
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.currentTarget.getAttribute('href').substring(1);

            tabs.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');

            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetId) {
                    content.classList.add('active');
                    content.style.display = 'grid'; // Assuming grid layout
                } else {
                    content.style.display = 'none';
                }
            });
        });
    });

    const init = async () => {
        try {
            // Fetch all data in parallel
            const [profile, userProducts, favoriteProducts] = await Promise.all([
                getMyProfile(),
                getProductsByUser(currentUser.id),
                getFavoriteProducts()
            ]);

            renderProfile(profile.data);
            renderProducts(userProducts.data, productsGrid);
            renderProducts(favoriteProducts.data, favoritesGrid);

        } catch (error) {
            showToast('Erro ao carregar o seu perfil.', 'error');
        }
    };

    editProfileBtn.addEventListener('click', () => {
        window.location.href = '/settings.html#profile';
    });

    init();
});
