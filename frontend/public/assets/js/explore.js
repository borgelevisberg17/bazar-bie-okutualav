import { getProducts, getCategories } from './services/api.js';
import { showToast } from './notifications.js';

document.addEventListener('DOMContentLoaded', () => {
    const productsGrid = document.getElementById('products-grid-explore');
    const categoryFilters = document.getElementById('category-filters');
    const priceRange = document.getElementById('price-range');
    const priceValue = document.getElementById('price-value');

    let currentPage = 1;
    let currentCategory = null;
    let currentMaxPrice = 100000;

    const renderProducts = (products) => {
        if (!productsGrid) return;

        if (products.length === 0 && currentPage === 1) {
            productsGrid.innerHTML = '<p>Nenhum produto encontrado com os filtros selecionados.</p>';
            return;
        }

        const productsHTML = products.map(product => {
            const priceFormatted = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price);
            return `
                <div class="product-card">
                    <a href="/product.html?id=${product.id}" class="product-card__image-container">
                        <img src="${product.image_url || 'assets/images/placeholders/product.png'}" alt="${product.name}" class="product-card__image">
                    </a>
                    <div class="product-card__content">
                        <a href="/product.html?id=${product.id}" class="product-card__title">${product.name}</a>
                        <p class="product-card__price">${priceFormatted}</p>
                        <a href="/seller.html?id=${product.seller_id}" class="product-card__seller">
                            <img src="${product.seller_avatar_url || 'assets/images/placeholders/avatar.png'}" alt="${product.seller_name}" class="product-card__seller-avatar">
                            <span class="product-card__seller-name">${product.seller_name}</span>
                        </a>
                    </div>
                </div>
            `;
        }).join('');

        if (currentPage === 1) {
            productsGrid.innerHTML = productsHTML;
        } else {
            productsGrid.insertAdjacentHTML('beforeend', productsHTML);
        }
    };

    const renderCategories = (categories) => {
        if (!categoryFilters) return;
        const categoriesHTML = categories.map(category => `
            <div class="filter-option">
                <input type="radio" id="cat-${category.slug}" name="category" value="${category.slug}">
                <label for="cat-${category.slug}">${category.name}</label>
            </div>
        `).join('');
        categoryFilters.innerHTML = categoriesHTML;
    };

    const loadProducts = async () => {
        try {
            const response = await getProducts(currentPage, 12, currentCategory);
            renderProducts(response.data);
        } catch (error) {
            showToast('Erro ao carregar os produtos.', 'error');
        }
    };

    const loadCategories = async () => {
        try {
            const response = await getCategories();
            renderCategories(response.data);
        } catch (error) {
            showToast('Erro ao carregar as categorias.', 'error');
        }
    };

    priceRange.addEventListener('input', () => {
        priceValue.textContent = `Kz ${new Intl.NumberFormat('pt-AO').format(priceRange.value)}`;
    });

    loadProducts();
    loadCategories();
});
