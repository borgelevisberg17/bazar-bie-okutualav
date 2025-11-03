import { getProductsBySeller, getSellerDetails } from './services/api.js';
import { showToast } from './notifications.js';

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sellerId = urlParams.get('id');

    if (!sellerId) {
        document.querySelector('.profile-page').innerHTML = '<p class="container">Vendedor não encontrado.</p>';
        return;
    }

    loadSellerProfile(sellerId);
});

async function loadSellerProfile(sellerId) {
    // --- DOM Elements ---
    const sellerBannerEl = document.getElementById('seller-banner');
    const sellerAvatarEl = document.getElementById('seller-avatar');
    const sellerNameEl = document.getElementById('seller-name');
    const sellerBioEl = document.getElementById('seller-bio');
    const productCountEl = document.getElementById('product-count');
    const followerCountEl = document.getElementById('follower-count');
    const sellerRatingEl = document.getElementById('seller-rating');
    const productsGrid = document.getElementById('seller-products-grid');

    productsGrid.innerHTML = '<div class="loading-spinner"></div>'; // Show loader

    try {
        // Fetch seller details and products in parallel
        const [sellerDetailsData, sellerProductsData] = await Promise.all([
            getSellerDetails(sellerId),
            getProductsBySeller(sellerId)
        ]);

        const seller = sellerDetailsData.data;
        const products = sellerProductsData.data;

        // Populate Seller Info
        document.title = `${seller.name} - Bazar Bié Okutuala`;
        sellerBannerEl.src = seller.cover_photo_url || 'assets/images/placeholders/seller-cover.png';
        sellerAvatarEl.src = seller.avatar_url || 'assets/images/placeholders/seller-avatar.png';
        sellerNameEl.textContent = seller.name;
        sellerBioEl.textContent = seller.bio || 'Este vendedor ainda não adicionou uma biografia.';

        // Populate Seller Stats (assuming API provides this data)
        productCountEl.textContent = products.length;
        followerCountEl.textContent = seller.followers_count || 0;
        sellerRatingEl.innerHTML = `${seller.average_rating || 'N/A'} <i class="fas fa-star"></i>`;

        renderProducts(productsGrid, products);

    } catch (error) {
        showToast("Ocorreu um erro ao carregar o perfil do vendedor.", "error");
        productsGrid.innerHTML = '<p>Não foi possível carregar os produtos.</p>';
    }
}

function renderProducts(container, products) {
    if (!products || products.length === 0) {
        container.innerHTML = '<p>Este vendedor ainda não tem produtos à venda.</p>';
        return;
    }

    container.innerHTML = products.map(product => {
        const imageUrl = product.images && product.images.length > 0
            ? product.images[0].image_url
            : 'assets/images/placeholders/product.png';
        const priceFormatted = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price);

        return `
            <div class="product-card">
                <a href="product.html?id=${product.id}" class="product-card__image-container">
                    <img src="${imageUrl}" alt="${product.name}" class="product-card__image">
                </a>
                <div class="product-card__content">
                    <a href="product.html?id=${product.id}" class="product-card__title">${product.name}</a>
                    <p class="product-card__price">${priceFormatted}</p>
                    <!-- Seller info can be omitted here as we are on the seller's page -->
                </div>
            </div>
        `;
    }).join('');
}
