// frontend/public/assets/js/ui/productCard.js

import { getSession } from '../auth.js';
import { likeProduct, unlikeProduct } from '../services/api.js';
import { showToast } from '../notifications.js';
import { setupCarousel } from './carousel.js';
import { setupQuickView } from './quickView.js';

export function renderProductPost(product, socialFeed) {
    const postCard = document.createElement("article");
    postCard.className = "product-post-card";
    const imageUrl = product.images && product.images.length > 0 ? product.images[0].image_url : '../images/placeholders/product.png';
    const priceFormatted = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price);

    const images = product.images && product.images.length > 0 ? product.images : [{ image_url: '../images/placeholders/product.png' }];
    const imageSlides = images.map(image => `
        <div class="carousel-slide">
            <a href="product.html?id=${product.id}">
                <img src="${image.image_url}" alt="${product.name}" class="product-image">
            </a>
        </div>
    `).join('');

    const dots = images.map((_, index) => `<span class="dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></span>`).join('');

    postCard.innerHTML = `
        <div class="post-header">
            <a href="seller.html?id=${product.seller?.id}" class="seller-link">
                <img src="${product.seller?.avatar_url || 'assets/images/placeholders/avatar.png'}" alt="${product.seller?.name}" class="seller-avatar">
                <span class="seller-name">${product.seller?.name}</span>
            </a>
        </div>
        <div class="post-image-carousel">
            <div class="carousel-track">${imageSlides}</div>
            ${images.length > 1 ? `
                <button class="carousel-btn prev"><i class="fas fa-chevron-left"></i></button>
                <button class="carousel-btn next"><i class="fas fa-chevron-right"></i></button>
                <div class="carousel-dots">${dots}</div>
            ` : ''}
            <button class="quick-view-btn" data-product-id="${product.id}"><i class="fas fa-eye"></i></button>
        </div>
        <div class="post-footer">
            <div class="post-actions">
                <div class="action-group">
                    <button class="action-btn" data-action="like" data-product-id="${product.id}"><i class="far fa-heart"></i></button>
                    <button class="action-btn" data-action="comment"><i class="far fa-comment"></i></button>
                    <button class="action-btn" data-action="share"><i class="far fa-paper-plane"></i></button>
                </div>
                <button class="btn-add-to-cart" data-product-id="${product.id}">
                    <i class="fas fa-cart-plus"></i> Adicionar
                </button>
            </div>
            <div class="post-description">
                <a href="product.html?id=${product.id}" class="product-name-link">
                    <h3 class="product-name">${product.name}</h3>
                </a>
                <p class="price">${priceFormatted}</p>
            </div>
            <div class="post-stats">
                <span>${product.likes_count || 0} gostos</span>
                <a href="product.html?id=${product.id}#comments" class="view-comments">
                   ${product.comments_count || 0} comentários
                </a>
            </div>
        </div>
    `;
    socialFeed.appendChild(postCard);
    setupCarousel(postCard);
    setupQuickView(postCard);
    setupLikeButtons(postCard);
}

function setupLikeButtons(postCard) {
    const likeBtn = postCard.querySelector('[data-action="like"]');
    if (likeBtn) {
        likeBtn.addEventListener('click', async () => {
            const productId = likeBtn.dataset.productId;
            const isLiked = likeBtn.classList.contains('liked');
            const currentUser = getSession()?.user;

            if (!currentUser) {
                showToast('Precisa de iniciar sessão para gostar de produtos.', 'info');
                return;
            }

            likeBtn.disabled = true;
            try {
                const response = isLiked ? await unlikeProduct(productId) : await likeProduct(productId);
                const likesCount = response.data.likes_count;

                likeBtn.classList.toggle('liked');
                likeBtn.querySelector('i').classList.toggle('far');
                likeBtn.querySelector('i').classList.toggle('fas');

                const postStats = postCard.querySelector('.post-stats span');
                if (postStats) {
                    postStats.textContent = `${likesCount} gostos`;
                }

            } catch (error) {
                showToast('Ocorreu um erro ao processar o seu gosto.', 'error');
            } finally {
                likeBtn.disabled = false;
            }
        });
    }
}
