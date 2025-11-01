import { getProducts, getSellers } from "./services/api.js";

document.addEventListener("DOMContentLoaded", async () => {
    const bestSellersGrid = document.getElementById("best-sellers-grid");
    const newArrivalsGrid = document.getElementById("new-arrivals-grid");
    const allProductsGrid = document.getElementById("all-products-grid");
    const sellersGrid = document.getElementById("sellers-grid");
    const loadMoreBtn = document.getElementById("load-more-btn");
    const categoriesGrid = document.getElementById("categories-grid");

    let currentPage = 1;
    const productsPerPage = 8;
    let currentFilter = "all";

    /**
     * Creates a product card element.
     * @param {Object} product - The product object.
     * @returns {HTMLElement} The product card element.
     */
    function createProductCard(product) {
        const card = document.createElement("div");
        card.className = "card";
        card.dataset.category = product.category;
        card.innerHTML = `
            <a href="product.html?id=${product.id}">
                <img src="${product.image_url || 'https://via.placeholder.com/250'}" alt="${product.name}">
                <div class="card-content">
                    <h3>${product.name}</h3>
                    <p class="price">${parseFloat(product.price).toLocaleString("pt-AO")} AOA</p>
                </div>
            </a>
        `;
        return card;
    }

    /**
     * Renders products to a given grid.
     * @param {HTMLElement} gridElement - The grid element to render products into.
     * @param {Array} products - An array of product objects.
     * @param {boolean} append - Whether to append the products or replace the content.
     */
    function renderProducts(gridElement, products, append = false) {
        if (!gridElement) return;
        if (!append) {
            gridElement.innerHTML = "";
        }
        products.forEach(product => {
            gridElement.appendChild(createProductCard(product));
        });
    }

    /**
     * Renders sellers to the sellers grid.
     * @param {Array} sellers - An array of seller objects.
     */
    function renderSellers(sellers) {
        if (!sellersGrid) return;
        sellersGrid.innerHTML = "";
        sellers.forEach(seller => {
            const sellerCard = document.createElement("div");
            sellerCard.className = "card";
            sellerCard.innerHTML = `
                <a href="seller.html?id=${seller.id}">
                    <img src="${seller.avatar_url || 'https://via.placeholder.com/200'}" alt="${seller.name}">
                    <div class="card-content">
                        <h4>${seller.name}</h4>
                    </div>
                </a>
            `;
            sellersGrid.appendChild(sellerCard);
        });
    }

    async function loadProducts(page = 1, filter = "all", append = false) {
        try {
            const productsData = await getProducts(page, productsPerPage, filter);
            const products = productsData.data || [];
            renderProducts(allProductsGrid, products, append);
            if (products.length < productsPerPage) {
                loadMoreBtn.style.display = "none";
            } else {
                loadMoreBtn.style.display = "block";
            }
        } catch (error) {
            console.error("Failed to load products:", error);
        }
    }

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener("click", () => {
            currentPage++;
            loadProducts(currentPage, currentFilter, true);
        });
    }

    if (categoriesGrid) {
        categoriesGrid.addEventListener("click", (e) => {
            const target = e.target.closest(".category-card");
            if (target) {
                e.preventDefault();
                currentFilter = target.dataset.filter;
                currentPage = 1;
                loadProducts(currentPage, currentFilter, false);

                document.querySelectorAll(".category-card").forEach(card => card.classList.remove("active"));
                target.classList.add("active");
            }
        });
    }

    try {
        const [productsData, sellersData] = await Promise.all([
            getProducts(),
            getSellers()
        ]);

        const allProducts = productsData.data || [];

        renderProducts(bestSellersGrid, allProducts.slice(0, 4));
        renderProducts(newArrivalsGrid, allProducts.slice(4, 8));
        renderSellers(sellersData.data || []);
        loadProducts();

    } catch (error) {
        console.error("Failed to load page data:", error);
    }
});
