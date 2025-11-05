// frontend/public/assets/js/main.js

import { showToast } from "./notifications.js";
import { getProducts } from "./services/api.js";
import { renderProductPost } from "./ui/productCard.js";

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
                products.forEach(product => renderProductPost(product, socialFeed));
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
