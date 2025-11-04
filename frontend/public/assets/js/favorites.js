import { getWishlist, removeFromWishlist } from './services/api.js';
import { showToast } from './notifications.js';
import { getSession } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const favoritesGrid = document.getElementById('favorites-grid');
    const noFavoritesMessage = document.getElementById('no-favorites-message');
    const user = getSession()?.user;

    if (!user) {
        window.location.href = '/auth/login.html';
        return;
    }

    const renderFavorites = (favorites) => {
        if (!favoritesGrid || !noFavoritesMessage) return;

        if (favorites.length === 0) {
            favoritesGrid.style.display = 'none';
            noFavoritesMessage.style.display = 'block';
            return;
        }

        favoritesGrid.style.display = 'grid';
        noFavoritesMessage.style.display = 'none';

        const favoritesHTML = favorites.map(item => {
            const product = item.product;
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
                    <div class="product-actions">
                         <button class="icon-btn btn-remove-favorite" data-product-id="${product.id}" aria-label="Remover dos Favoritos">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        favoritesGrid.innerHTML = favoritesHTML;
    };

    const init = async () => {
        try {
            const response = await getWishlist();
            renderFavorites(response.data);
        } catch (error) {
            showToast('Erro ao carregar os seus favoritos.', 'error');
        }
    };

    favoritesGrid.addEventListener('click', async (e) => {
        const removeButton = e.target.closest('.btn-remove-favorite');
        if (removeButton) {
            const productId = removeButton.dataset.productId;
            try {
                await removeFromWishlist(productId);
                showToast('Produto removido dos favoritos.', 'success');
                init(); // Re-render the favorites
            } catch (error) {
                showToast('Erro ao remover o produto dos favoritos.', 'error');
            }
        }
    });

    init();
});
