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
            <div class="product-details-container">
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
                <section class="product-info">
                    <div class="product-header">
                        <span class="product-category">${product.category?.name || 'Sem Categoria'}</span>
                        <h1 class="product-title">${product.name}</h1>
                        <p class="product-price">${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)}</p>
                    </div>

                    <div class="product-description">
                        <p>${product.description}</p>
                    </div>

                    <div class="product-actions">
                        <div class="quantity-selector">
                            <button class="btn-quantity" id="decrease-qty"><i class="fas fa-minus"></i></button>
                            <span id="quantity-display">1</span>
                            <button class="btn-quantity" id="increase-qty"><i class="fas fa-plus"></i></button>
                        </div>
                        <button class="btn btn-primary btn-add-to-cart" id="add-to-cart-btn">
                            <i class="fas fa-shopping-cart"></i> Adicionar ao Carrinho
                        </button>
                    </div>

                    <div class="social-actions">
                         <button class="btn social-btn" id="like-btn" data-liked="${product.is_liked}">
                            <i class="${product.is_liked ? 'fas' : 'far'} fa-heart"></i> <span>${product.likes_count} Gostos</span>
                        </button>
                        <button class="btn social-btn" id="comment-btn">
                           <i class="far fa-comment"></i> <span>${product.comments_count} Comentários</span>
                       </button>
                    </div>
                </section>

                <!-- Seller Card -->
                <aside class="seller-card-container">
                     <div class="seller-card">
                        <a href="seller.html?id=${product.seller.id}" class="seller-link">
                            <img src="${product.seller.avatar_url || 'assets/images/placeholders/avatar.png'}" class="seller-avatar" alt="Vendedor">
                            <div class="seller-details">
                               <span class="seller-name">${product.seller.name}</span>
                               <span class="seller-rating">Vendedor Verificado</span>
                            </div>
                        </a>
                        <button class="btn btn-outline">Seguir</button>
                    </div>
                </aside>
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
        const likesCountSpan = likeBtn.querySelector('span');
        let currentLikes = parseInt(likesCountSpan.textContent.split(' ')[0]);

        // Optimistic UI update
        likeBtn.dataset.liked = !isLiked;
        likeBtn.querySelector('i').classList.toggle('fas');
        likeBtn.querySelector('i').classList.toggle('far');
        likesCountSpan.textContent = `${isLiked ? currentLikes - 1 : currentLikes + 1} Gostos`;
        likeBtn.disabled = true;

        try {
            const response = isLiked ? await unlikeProduct(productId) : await likeProduct(productId);
            // Update with actual count from server to ensure consistency
            likesCountSpan.textContent = `${response.data.likes_count} Gostos`;
        } catch (error) {
            // Revert UI on error
            showToast('Ocorreu um erro ao processar o seu gosto.', 'error');
            likeBtn.dataset.liked = isLiked;
            likeBtn.querySelector('i').classList.toggle('fas');
            likeBtn.querySelector('i').classList.toggle('far');
            likesCountSpan.textContent = `${currentLikes} Gostos`;
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
