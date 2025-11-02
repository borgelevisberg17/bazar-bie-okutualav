import { getCategories, getProducts, api } from "./services/api.js";

document.addEventListener("DOMContentLoaded", async () => {
    const categoryFilterList = document.getElementById("category-filter-list");
    const productsGrid = document.getElementById("products-grid-category");
    const categoryTitle = document.getElementById("category-title");
    const priceRange = document.getElementById("price-range");
    const priceValue = document.getElementById("price-value");
    const sortSelect = document.getElementById("sort-select");
    const loader = document.getElementById("loader");

    let allProducts = [];
    let filteredProducts = [];
    let currentPage = 1;
    const productsPerPage = 12;
    let isLoading = false;

    try {
        const [categoriesData, productsData] = await Promise.all([
            getCategories(),
            getProducts(currentPage, productsPerPage)
        ]);

        const categories = categoriesData?.data || [];
        allProducts = productsData?.data || [];
        filteredProducts = [...allProducts];

        populateCategories(categories);
        renderProducts(filteredProducts);
        currentPage++;

    } catch (error) {
        console.error("Error loading page data:", error);
    }

    function populateCategories(categories) {
        categoryFilterList.innerHTML = `
            <li class="active" data-slug="all">Todas</li>
            ${categories.map(c => `<li data-slug="${c.slug}">${c.name}</li>`).join('')}
        `;
    }

    function renderProducts(products, append = false) {
        const productsHTML = products.map(product => `
            <div class="product-card" data-category="${product.category}">
                <a href="product-details.html?id=${product.id}" class="product-link">
                    <div class="product-image">
                        <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
                    </div>
                    <div class="product-info">
                        <h3>${product.name}</h3>
                        <p class="product-price">${parseFloat(product.price).toLocaleString("pt-AO")} Kz</p>
                    </div>
                </a>
            </div>
        `).join('');

        if (append) {
            productsGrid.innerHTML += productsHTML;
        } else {
            productsGrid.innerHTML = productsHTML;
        }
    }

    async function loadMoreProducts() {
        if (isLoading) return;
        isLoading = true;
        loader.innerHTML = '<div class="spinner"></div>';

        try {
            const productsData = await getProducts(currentPage, productsPerPage);
            const newProducts = productsData.data || [];

            if (newProducts.length > 0) {
                allProducts = [...allProducts, ...newProducts];
                applyFilters();
                currentPage++;
            } else {
                loader.innerHTML = '<p style="color:var(--muted)">Você chegou ao fim!</p>';
            }
        } catch (error) {
            console.error("Error loading more products:", error);
        } finally {
            isLoading = false;
        }
    }

    function applyFilters() {
        const activeCategory = categoryFilterList.querySelector("li.active").dataset.slug;
        const maxPrice = parseInt(priceRange.value);

        filteredProducts = allProducts.filter(product => {
            const categoryMatch = activeCategory === 'all' || product.category === activeCategory;
            const priceMatch = product.price <= maxPrice;
            return categoryMatch && priceMatch;
        });

        sortProducts();
        renderProducts(filteredProducts);
    }

    function sortProducts() {
        const sortBy = sortSelect.value;
        if (sortBy === 'price_asc') {
            filteredProducts.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price_desc') {
            filteredProducts.sort((a, b) => b.price - a.price);
        }
    }

    const observer = new IntersectionObserver(
        entries => {
            if (entries[0].isIntersecting) {
                loadMoreProducts();
            }
        },
        { rootMargin: "200px" }
    );

    observer.observe(loader);

    categoryFilterList.addEventListener("click", e => {
        if (e.target.tagName === "LI") {
            categoryFilterList.querySelectorAll("li").forEach(li => li.classList.remove("active"));
            e.target.classList.add("active");
            categoryTitle.textContent = e.target.textContent;
            applyFilters();
        }
    });

    priceRange.addEventListener("input", () => {
        priceValue.textContent = `Kz ${parseInt(priceRange.value).toLocaleString("pt-AO")}`;
        applyFilters();
    });

    sortSelect.addEventListener("change", () => {
        applyFilters();
    });
});
