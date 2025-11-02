import { getProducts, getCategories, api } from "./services/api.js";

document.addEventListener("DOMContentLoaded", async () => {
    const productsGrid = document.getElementById("products-grid");
    const categoryFilters = document.getElementById("category-filters");
    const loadMoreBtn = document.getElementById("load-more-btn");

    let currentPage = 1;
    let currentCategory = 'all';
    const productsPerPage = 12;

    await loadPageData();

    async function loadPageData() {
        productsGrid.innerHTML = '<div class="loading-spinner"></div>';
        try {
            const [productsData, categoriesData] = await Promise.all([
                getProducts(currentPage, productsPerPage),
                getCategories()
            ]);

            const products = productsData?.data || [];
            const categories = categoriesData?.data || [];

            renderCategories(categories);
            renderProducts(productsGrid, products, false);

            if (products.length === productsPerPage) {
                document.querySelector('.load-more-container').style.display = 'block';
            }

        } catch (error) {
            console.log("erro: ", error);
            productsGrid.innerHTML = "<p>Ocorreu um erro ao carregar os produtos.</p>";
        }
    }

    function renderCategories(categories) {
        categoryFilters.innerHTML = `<button class="filter-btn active" data-category="all">Todos</button>`;
        categories.forEach(category => {
            categoryFilters.innerHTML += `<button class="filter-btn" data-category="${category.slug}">${category.name}</button>`;
        });

        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', async () => {
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentCategory = button.dataset.category;
                currentPage = 1;

                productsGrid.innerHTML = '<div class="loading-spinner"></div>';
                const productsData = await getProducts(currentPage, productsPerPage, currentCategory === 'all' ? null : currentCategory);
                renderProducts(productsGrid, productsData.data, false);
            });
        });
    }

    function renderProductCard(product) {
        const productCard = document.createElement("article");
        productCard.className = "product-card";

        const imageUrl = product.image_url || "assets/images/placeholders/product.png";
        const sellerAvatarUrl = product.seller?.avatar_url || "assets/images/placeholders/avatar.png";

        productCard.innerHTML = `
            <div class="product-card-header">
                <img src="${sellerAvatarUrl}" alt="${product.seller?.name || 'Vendedor'}" class="seller-avatar">
                <div class="seller-info">
                    <a href="seller.html?id=${product.seller?.id}" class="seller-name">${product.seller?.name || 'Vendedor'}</a>
                    <span class="post-time">Publicado há pouco</span>
                </div>
            </div>
            <a href="product.html?id=${product.id}" class="product-image-container">
                <img src="${imageUrl}" alt="${product.name}" class="product-image" loading="lazy">
            </a>
            <div class="product-info">
                <a href="product.html?id=${product.id}" class="product-title">${product.name}</a>
                <p class="product-price">${parseFloat(product.price).toLocaleString("pt-AO", { style: 'currency', currency: 'AOA' })}</p>
            </div>
            <div class="product-card-footer">
                <div class="product-actions">
                     <button class="product-action-btn btn-wishlist" aria-label="Adicionar aos favoritos">
                        <i class="fa-regular fa-heart"></i>
                    </button>
                    <button class="product-action-btn" aria-label="Comentar">
                        <i class="fa-regular fa-comment"></i>
                    </button>
                </div>
                <button class="btn btn-primary btn-add-to-cart">Adicionar</button>
            </div>
        `;
        return productCard;
    }

    function renderProducts(container, productsToRender, append = false) {
        if (!container) return;

        const loadingSpinner = container.querySelector('.loading-spinner');
        if (loadingSpinner) {
            loadingSpinner.remove();
        }

        if (!append) {
            container.innerHTML = "";
        }

        if (productsToRender.length === 0) {
            if (!append) container.innerHTML = "<p>Nenhum produto encontrado para esta categoria.</p>";
            if (loadMoreBtn) loadMoreBtn.style.display = "none";
            return;
        }

        productsToRender.forEach(product => {
            const productCard = renderProductCard(product);
            container.appendChild(productCard);
        });
    }
});
