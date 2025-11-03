import { showToast } from "./notifications.js";
import { getProducts } from "./services/api.js";

document.addEventListener("DOMContentLoaded", () => {
    const socialFeed = document.getElementById("social-feed");
    let currentPage = 1;
    const productsPerPage = 10;
    let isLoading = false;
    let hasMore = true;

    const loadProducts = async (page) => {
        if (isLoading || !hasMore) return;
        isLoading = true;

        try {
            const productsData = await getProducts(page, productsPerPage);
            const products = productsData?.data || [];

            if (products.length === 0) {
                hasMore = false;
                if(page === 1) {
                    socialFeed.innerHTML = "<p>Nenhum produto encontrado. Comece a seguir vendedores!</p>";
                }
            } else {
                renderProductPosts(products);
                currentPage++;
            }
            if (products.length < productsPerPage) {
                hasMore = false;
            }

        } catch (error) {
            showToast("Erro ao carregar o feed.", "error");
        } finally {
            isLoading = false;
        }
    };

    const renderProductPosts = (products) => {
        products.forEach(product => {
            const postCard = document.createElement("article");
            postCard.className = "product-post-card";
            const imageUrl = product.images && product.images.length > 0 ? product.images[0].image_url : 'assets/images/placeholders/product.png';
            const priceFormatted = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price);

            postCard.innerHTML = `
                <div class="post-header">
                    <a href="seller.html?id=${product.seller?.id}">
                        <img src="${product.seller?.avatar_url || 'assets/images/placeholders/avatar.png'}" alt="${product.seller?.name}" class="seller-avatar">
                    </a>
                    <div class="seller-info">
                        <a href="seller.html?id=${product.seller?.id}" class="seller-name">${product.seller?.name}</a>
                    </div>
                </div>
                <div class="post-image">
                    <a href="product.html?id=${product.id}">
                        <img src="${imageUrl}" alt="${product.name}" class="product-image">
                    </a>
                </div>
                <div class="post-footer">
                    <div class="post-actions">
                        <div class="action-group">
                            <button class="action-btn" data-action="like" data-product-id="${product.id}"><i class="far fa-heart"></i></button>
                            <button class="action-btn" data-action="comment"><i class="far fa-comment"></i></button>
                            <button class="action-btn" data-action="share"><i class="far fa-paper-plane"></i></button>
                        </div>
                        <a href="product.html?id=${product.id}" class="btn-buy" data-product-id="${product.id}">
                            <span>${priceFormatted}</span>
                        </a>
                    </div>
                    <div class="post-stats">
                        <span>${product.likes_count || 0} gostos</span>
                    </div>
                    <div class="post-description">
                        <a href="seller.html?id=${product.seller?.id}" class="seller-name">${product.seller?.name}</a>
                        <span class="product-name">${product.name}</span>
                    </div>
                     <a href="product.html?id=${product.id}#comments" class="view-comments">
                        Ver todos os ${product.comments_count || 0} comentários
                    </a>
                </div>
            `;
            socialFeed.appendChild(postCard);
        });
    };

    const setupInfiniteScroll = () => {
        const sentinel = document.getElementById('sentinel') || document.createElement('div');
        sentinel.id = 'sentinel';
        socialFeed.insertAdjacentElement('afterend', sentinel);

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) {
                loadProducts(currentPage);
            }
        }, { threshold: 0.5 });

        observer.observe(sentinel);
    };

    loadProducts(currentPage);
    setupInfiniteScroll();
});
