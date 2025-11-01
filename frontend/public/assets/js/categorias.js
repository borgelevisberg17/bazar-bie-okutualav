import { getProducts } from "./services/api.js";

document.addEventListener("DOMContentLoaded", async () => {
    const productsGrid = document.getElementById("products-grid");
    const loadMoreBtn = document.getElementById("load-more-btn");
    const filtersSidebar = document.querySelector(".filters-sidebar");

    let currentPage = 1;
    const productsPerPage = 12;
    let currentFilter = {};

    function createProductCard(product) {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <a href="product.html?id=${product.id}">
                <img src="${product.image_url || 'https://via.placeholder.com/220'}" alt="${product.name}">
                <div class="card-content">
                    <h3>${product.name}</h3>
                    <p class="price">${parseFloat(product.price).toLocaleString("pt-AO")} AOA</p>
                </div>
            </a>
        `;
        return card;
    }

    function renderProducts(products, append = false) {
        if (!productsGrid) return;
        if (!append) {
            productsGrid.innerHTML = "";
        }
        products.forEach(product => {
            productsGrid.appendChild(createProductCard(product));
        });
    }

    async function loadProducts(page = 1, filters = {}, append = false) {
        try {
            const productsData = await getProducts(page, productsPerPage, filters);
            const products = productsData.data || [];
            renderProducts(products, append);
            if (products.length < productsPerPage) {
                if (loadMoreBtn) loadMoreBtn.style.display = "none";
            } else {
                if (loadMoreBtn) loadMoreBtn.style.display = "block";
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

    if (filtersSidebar) {
        filtersSidebar.addEventListener("change", () => {
            currentPage = 1;
            // This is a simplified filter logic. A real implementation would
            // gather all filter values from the sidebar.
            currentFilter = {
                // Example: brand: document.querySelector('input[name="brand"]:checked').value
            };
            loadProducts(currentPage, currentFilter, false);
        });
    }

    loadProducts();
});
