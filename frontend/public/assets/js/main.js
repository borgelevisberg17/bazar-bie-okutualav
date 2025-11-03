import { showToast } from "./notifications.js";
import { getProducts } from "./services/api.js";

document.addEventListener("DOMContentLoaded", () => {
    const socialFeed = document.getElementById("social-feed");

    // Infinite Scroll Observer
    let observer;
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

            postCard.innerHTML = `
                <div class="post-header">
                    <img src="${product.seller?.avatar_url || 'assets/images/placeholders/avatar.png'}" alt="${product.seller?.name}" class="seller-avatar">
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
                        <div>
                            <button class="action-btn" data-action="like"><i class="far fa-heart"></i></button>
                            <button class="action-btn" data-action="comment"><i class="far fa-comment"></i></button>
                            <button class="action-btn" data-action="share"><i class="far fa-paper-plane"></i></button>
                        </div>
                        <button class="action-btn btn-buy" data-action="add-to-cart" data-product-id="${product.id}">
                            <i class="fas fa-shopping-bag"></i>
                            <span>${new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price)}</span>
                        </button>
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
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5
        };

        observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadProducts(currentPage);
            }
        }, options);

        // Create a sentinel element to observe
        const sentinel = document.createElement('div');
        sentinel.id = 'sentinel';
        socialFeed.insertAdjacentElement('afterend', sentinel);
        observer.observe(sentinel);
    };

    // Initial Load
    loadProducts(currentPage);
    setupInfiniteScroll();
});
