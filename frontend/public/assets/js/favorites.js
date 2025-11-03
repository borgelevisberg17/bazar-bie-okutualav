import { showToast } from './notifications.js';
import { getFavoriteProducts, removeFavorite } from './services/api.js';
import { getUserSession } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const favoritesGrid = document.getElementById('favorites-grid');
    const noFavoritesMessage = document.getElementById('no-favorites-message');
    const currentUser = getUserSession()?.user;

    const renderFavorites = (products) => {
        favoritesGrid.innerHTML = '';
        if (!products || products.length === 0) {
            noFavoritesMessage.style.display = 'flex';
            favoritesGrid.style.display = 'none';
            return;
        }

        noFavoritesMessage.style.display = 'none';
        favoritesGrid.style.display = 'grid';

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.productId = product.id;
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
                <div class="product-actions">
                    <a href="product.html?id=${product.id}" class="btn btn-secondary">Ver Detalhes</a>
                    <button class="icon-btn btn-remove-favorite" data-product-id="${product.id}" aria-label="Remover dos Favoritos">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            `;
            favoritesGrid.appendChild(productCard);
        });
    };

    const handleRemoveFavorite = async (productId) => {
        try {
            await removeFavorite(productId);
            showToast('Produto removido dos favoritos.', 'success');
            // Remove the card from the UI
            const cardToRemove = document.querySelector(`.product-card[data-product-id="${productId}"]`);
            if (cardToRemove) {
                cardToRemove.remove();
            }
            // Check if grid is now empty
            if (favoritesGrid.children.length === 0) {
                 noFavoritesMessage.style.display = 'flex';
                 favoritesGrid.style.display = 'none';
            }
        } catch (error) {
            showToast('Erro ao remover favorito. Tente novamente.', 'error');
        }
    };

    const init = async () => {
        if (!currentUser) {
            window.location.href = '/auth/login.html';
            return;
        }

        try {
            const response = await getFavoriteProducts();
            renderFavorites(response.data);
        } catch (error) {
            showToast('Erro ao carregar os seus favoritos.', 'error');
            noFavoritesMessage.style.display = 'flex';
            favoritesGrid.style.display = 'none';
            noFavoritesMessage.querySelector('h2').textContent = 'Ocorreu um erro.';
            noFavoritesMessage.querySelector('p').textContent = 'Não foi possível carregar os seus produtos favoritos.';
        }
    };

    favoritesGrid.addEventListener('click', (e) => {
        const removeButton = e.target.closest('.btn-remove-favorite');
        if (removeButton) {
            const productId = removeButton.dataset.productId;
            handleRemoveFavorite(productId);
        }
    });

    init();
});
