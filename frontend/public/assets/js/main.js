import { getCategories, getProducts, getSellers, api } from "./services/api.js";

document.addEventListener("DOMContentLoaded", async () => {
    const filtersContainer = document.getElementById("filters");
    const productsGrid = document.getElementById("products-grid");
    const recentArrived = document.getElementById("recently-arrived");
    const topFinds = document.getElementById("top-finds");
    const categoryShelf = document.getElementById("categorieList");
    const loadMoreBtn = document.getElementById("load-more-btn");
    const sellersGrid = document.getElementById("sellersGrid");

    let currentPage = 1;
    const productsPerPage = 12;

    await loadPageData();

    async function loadPageData() {
        try {
            const [categoriesData, productsData, sellersData] = await Promise.all([
                getCategories(),
                getProducts(currentPage, productsPerPage),
                getSellers(),
            ]);

            const categories = categoriesData?.data || [];
            const products = productsData?.data || [];
            const sellers = sellersData?.data || [];

            renderCategories(categories);
            renderFilters(categories);
            renderProducts(productsGrid, products, true);
            renderProducts(recentArrived, products.slice(0, 4));
            renderProducts(topFinds, products.slice(4, 8));
            renderSellers(sellers);
            setupFiltering();
        } catch (error) {
            console.log("erro: ", error);
        }
    }

    const categoryIcons = {
        'smartphones': 'fa-mobile-screen-button',
        'laptops': 'fa-laptop',
        'fragrances': 'fa-spray-can-sparkles',
        'skincare': 'fa-spa',
        'groceries': 'fa-carrot',
        'home-decoration': 'fa-house-chimney',
        'default': 'fa-tag'
    };

    function renderCategories(categories) {
        if (!categoryShelf) return;
        if (categories.length === 0) {
            categoryShelf.innerHTML = "";
            return;
        }
        categoryShelf.innerHTML = categories
            .map(c => `
                <a class="category-item" data-cat="${c.slug}">
                    <div class="category-icon">
                        <i class="fa-solid ${categoryIcons[c.slug] || categoryIcons['default']}"></i>
                    </div>
                    <span>${c.name}</span>
                </a>
            `)
            .join("");
    }

    function renderFilters(categories) {
        if (!filtersContainer) return;
        filtersContainer.innerHTML = "";
        const allBtn = document.createElement("button");
        allBtn.className = "filter-btn active";
        allBtn.dataset.filter = "all";
        allBtn.textContent = "Todos";
        filtersContainer.appendChild(allBtn);

        categories.forEach(cat => {
            const filterBtn = document.createElement("button");
            filterBtn.className = "filter-btn";
            filterBtn.dataset.filter = cat.slug;
            filterBtn.textContent = cat.name;
            filtersContainer.appendChild(filterBtn);
        });
    }

    function renderProductCard(product) {
        const productCard = document.createElement("article");
        productCard.className = "product-card";
        productCard.dataset.category = product.category;

        const imageUrl = product.image_url || "assets/images/placeholders/product.png";

        productCard.innerHTML = `
            <a href="product.html?id=${product.id}" class="product-link" data-property-id="${product.id}">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${product.name}" loading="lazy">
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="product-price">${parseFloat(product.price).toLocaleString("pt-AO")} Kz</p>
                </div>
            </a>
            <div class="product-card-footer">
                 <button class="btn-wishlist" aria-label="Adicionar aos favoritos">
                    <i class="fa-regular fa-heart"></i>
                </button>
                <button class="btn-cart" aria-label="Adicionar ao carrinho">
                    <i class="fa-solid fa-cart-shopping"></i>
                </button>
            </div>
        `;

        productCard.querySelector(".btn-cart").addEventListener("click", event => {
            event.preventDefault();
            const button = event.currentTarget;
            button.classList.add("adding");
            setTimeout(() => {
                button.classList.remove("adding");
            }, 1000);
            showToast("Produto adicionado ao carrinho!");
        });

        productCard.querySelector(".btn-wishlist").addEventListener("click", async event => {
            event.preventDefault();
            try {
                await api.post("/wishlist", { productId: product.id });
                showToast("Produto adicionado aos favoritos!");
            } catch (error) {
                showToast("Erro ao adicionar aos favoritos.", "error");
            }
        });
        return productCard;
    }

    function renderProducts(container, productsToRender, append = false) {
        if (!container) return;
        if (productsToRender.length === 0) {
            if (!append) container.innerHTML = "<p>Nenhum produto encontrado.</p>";
            if (loadMoreBtn) loadMoreBtn.style.display = "none";
            return;
        }
        if (!append) {
            container.innerHTML = "";
        }
        productsToRender.forEach(product => {
            const productCard = renderProductCard(product);
            container.appendChild(productCard);
        });
    }

    function setupFiltering() {
        const filterButtons = document.querySelectorAll(".filter-btn");
        const productCards = document.querySelectorAll(".product-card");

        if (filterButtons.length === 0) return;

        filterButtons.forEach(button => {
            button.addEventListener("click", () => {
                const filter = button.dataset.filter;

                filterButtons.forEach(btn => btn.classList.remove("active"));
                button.classList.add("active");

                productCards.forEach(card => {
                    card.style.display = (filter === "all" || card.dataset.category === filter) ? "block" : "none";
                });
            });
        });
    }

    async function handleLoadMore() {
        currentPage++;
        try {
            const productsData = await getProducts(currentPage, productsPerPage);
            const products = productsData?.data || [];
            renderProducts(productsGrid, products, true);
        } catch (error) {
            console.error("Erro ao carregar mais produtos:", error);
            if(loadMoreBtn) loadMoreBtn.style.display = "none";
        }
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", handleLoadMore);
    }

    const currentYear = document.getElementById("currentYear");
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    function renderSellers(sellersToRender) {
        if (!sellersGrid) return;
        if (sellersToRender.length === 0) {
            sellersGrid.innerHTML = "<p>Nenhum vendedor encontrado.</p>";
            return;
        }
        sellersGrid.innerHTML = "";
        sellersToRender.forEach((seller, index) => {
            const sellerCard = document.createElement("div");
            sellerCard.className = "seller-card fade-in";
            sellerCard.style.transitionDelay = `${index * 0.1}s`;
            sellerCard.innerHTML = `
                    <img src="${
                        seller.avatar || "assets/images/placeholders/avatar.png"
                    }" alt="${seller.name}" loading="lazy">
                    <h3>${seller.name}</h3>
                    <p>${seller.specialty || ""}</p>
                `;
            sellersGrid.appendChild(sellerCard);
        });
    }
});
