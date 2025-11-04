import { getProductById, likeProduct, unlikeProduct, addComment } from './services/api.js';
import { showToast } from './notifications.js';
import { getSession } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const productId = new URLSearchParams(window.location.search).get('id');
    const currentUser = getSession()?.user;
    const pageContent = document.getElementById('product-details-page');

    if (!productId) {
        pageContent.innerHTML = '<p class="text-center error">Produto não encontrado. ID inválido.</p>';
        return;
    }

    const renderProduct = (product) => {
        document.title = `${product.name} - Bazar Bié Okutuala`;

        const productHTML = `
            <div class="product-details-grid">
                <!-- Image Gallery -->
                <section class="product-gallery">
                    <div class="main-image-container">
                        <img src="${product.images[0]?.image_url || 'assets/images/placeholders/product-main.png'}" alt="Produto Principal" id="main-product-image">
                    </div>
                    <div class="thumbnail-gallery" id="thumbnail-gallery">
                        ${product.images.map(img => `<div class="thumbnail-item"><img src="${img.image_url}" alt="Thumbnail"></div>`).join('')}
                    </div>
                </section>

                <!-- Product Info -->
                <section class="product-info-card">
                    <div class="product-category">${product.category?.name || 'Sem Categoria'}</div>
                    <h1 class="product-title">${product.name}</h1>
                    <p class="product-price">${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)}</p>

                    <div class="seller-card">
                        <a href="seller.html?id=${product.seller.id}">
                            <img src="${product.seller.avatar_url || 'assets/images/placeholders/avatar.png'}" class="seller-avatar" alt="Vendedor">
                        </a>
                        <div class="seller-details">
                            <a href="seller.html?id=${product.seller.id}" class="seller-name">${product.seller.name}</a>
                            <span class="seller-rating">Vendedor Verificado</span>
                        </div>
                    </div>

                    <p class="product-description">${product.description.substring(0, 150)}...</p>

                    <div class="product-actions">
                        <div class="quantity-selector">
                            <button class="btn-quantity" id="decrease-qty">-</button>
                            <input type="number" id="quantity" value="1" min="1">
                            <button class="btn-quantity" id="increase-qty">+</button>
                        </div>
                        <button class="btn btn-primary btn-add-to-cart" id="add-to-cart-btn"><i class="fas fa-shopping-cart"></i> Adicionar</button>
                    </div>
                    <div class="social-actions">
                         <button class="btn social-btn" id="like-btn" data-liked="${product.is_liked}">
                            <i class="${product.is_liked ? 'fas' : 'far'} fa-heart"></i> <span>${product.likes_count}</span>
                        </button>
                        <button class="btn social-btn" id="comment-btn"><i class="far fa-comment"></i> <span>${product.comments_count}</span></button>
                    </div>
                </section>
            </div>
        `;
        pageContent.innerHTML = productHTML;
        addEventListeners(product);
    };

    const addEventListeners = (product) => {
        // Image gallery
        const mainImage = document.getElementById('main-product-image');
        const thumbnails = document.querySelectorAll('.thumbnail-item img');
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => mainImage.src = thumb.src);
        });

        // Like button
        const likeBtn = document.getElementById('like-btn');
        likeBtn.addEventListener('click', () => handleLikeToggle(product.id, likeBtn));
    };

    const handleLikeToggle = async (productId, likeBtn) => {
        if (!currentUser) {
            showToast('Precisa de iniciar sessão para gostar de produtos.', 'info');
            return;
        }
        const isLiked = likeBtn.dataset.liked === 'true';
        likeBtn.disabled = true;
        try {
            const response = isLiked ? await unlikeProduct(productId) : await likeProduct(productId);
            likeBtn.dataset.liked = !isLiked;
            likeBtn.innerHTML = `<i class="${!isLiked ? 'fas' : 'far'} fa-heart"></i> <span>${response.data.likes_count}</span>`;
        } catch (error) {
            showToast('Ocorreu um erro.', 'error');
        } finally {
            likeBtn.disabled = false;
        }
    };


    const init = async () => {
        try {
            const response = await getProductById(productId);
            renderProduct(response.data);
        } catch (error) {
            pageContent.innerHTML = '<p class="text-center error">Ocorreu um erro ao carregar este produto.</p>';
        }
    };

    init();
});
