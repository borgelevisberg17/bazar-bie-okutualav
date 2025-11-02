import { getProducts, api } from './services/api.js';

document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();

            tabs.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');

            const target = document.querySelector(tab.getAttribute('href'));

            tabContents.forEach(content => content.classList.remove('active'));
            target.classList.add('active');
        });
    });

    // Load initial content for the active tab
    loadTabContent(document.querySelector('.tab-link.active').getAttribute('href'));
});

async function loadTabContent(tabId) {
    const container = document.querySelector(`${tabId} .products-grid`);
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner"></div>';

    try {
        let products = [];
        if (tabId === '#products') {
            // Placeholder for fetching user's own products
            // const response = await api.get('/user/products');
            // products = response.data;
        } else if (tabId === '#favorites') {
            // Placeholder for fetching user's favorite products
            // const response = await api.get('/user/favorites');
            // products = response.data;
        }

        // Render placeholder products for now
        const productData = await getProducts();
        products = productData.data.slice(0, 4); // Dummy data

        renderProducts(container, products);

    } catch (error) {
        container.innerHTML = '<p>Ocorreu um erro ao carregar os produtos.</p>';
        console.error(`Error loading content for ${tabId}:`, error);
    }
}

function renderProducts(container, products) {
    if (products.length === 0) {
        container.innerHTML = '<p>Nenhum produto encontrado.</p>';
        return;
    }

    container.innerHTML = products.map(product => `
        <article class="product-card">
            <!-- Using the same product card structure -->
            <a href="product.html?id=${product.id}" class="product-image-container">
                <img src="${product.image_url || 'assets/images/placeholders/product.png'}" alt="${product.name}" class="product-image" loading="lazy">
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
        </article>
    `).join('');
}
