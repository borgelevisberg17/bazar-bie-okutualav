import { getProductById, getProductReviews, api } from "./services/api.js";
import { showToast } from "./notifications.js";
import { getSession } from '../auth.js';

document.addEventListener("DOMContentLoaded", async () => {
    // --- State ---
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");
    const session = getSession();

    if (!productId) {
        document.querySelector('main.container').innerHTML = '<p>ID do produto não encontrado.</p>';
        return;
    }

    // --- DOM Elements ---
    const mainImageEl = document.getElementById("main-product-image");
    const thumbnailGalleryEl = document.getElementById("thumbnail-gallery");
    const productNameEl = document.getElementById("product-name");
    const productPriceEl = document.getElementById("product-price");
    const productDescriptionEl = document.getElementById("product-description");
    const productLongDescriptionEl = document.getElementById("product-long-description");
    const sellerAvatarEl = document.getElementById("seller-avatar");
    const sellerNameEl = document.getElementById("seller-name");
    const sellerLink = document.getElementById("seller-link");

    // --- Functions ---
    const renderProduct = (product) => {
        document.title = `${product.name} - Bazar Bié Okutuala`;
        productNameEl.textContent = product.name;
        productPriceEl.textContent = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price);
        productDescriptionEl.textContent = product.description.substring(0, 150) + '...';
        productLongDescriptionEl.textContent = product.description;

        // Render Seller Info
        if (product.seller) {
            sellerAvatarEl.src = product.seller.avatar_url || 'assets/images/placeholders/avatar.png';
            sellerNameEl.textContent = product.seller.name;
            sellerLink.href = `seller.html?id=${product.seller.id}`;
            sellerNameEl.href = `seller.html?id=${product.seller.id}`;
        }

        // Render Image Gallery
        if (product.images && product.images.length > 0) {
            mainImageEl.src = product.images[0].image_url;
            thumbnailGalleryEl.innerHTML = product.images.map((image, index) => `
                <img src="${image.image_url}" alt="Thumbnail ${index + 1}" class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
            `).join('');
        }
    };

    const renderReviews = (reviews) => {
        const commentsListEl = document.getElementById("comments-list");
        if (!reviews || reviews.length === 0) {
            commentsListEl.innerHTML = "<p>Ainda não há avaliações para este produto.</p>";
            return;
        }
        commentsListEl.innerHTML = reviews.map(review => `
            <div class="comment-item">
                <img src="${review.user.avatar_url || 'assets/images/placeholders/avatar.png'}" alt="${review.user.name}" class="comment-avatar">
                <div class="comment-content">
                    <a href="profile.html?id=${review.user.id}" class="comment-author">${review.user.name}</a>
                    <p class="comment-text">${review.comment}</p>
                </div>
            </div>
        `).join('');
    };

    const setupEventListeners = () => {
        // Image Gallery
        thumbnailGalleryEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('thumbnail')) {
                mainImageEl.src = e.target.src;
                document.querySelectorAll('.thumbnail').forEach(thumb => thumb.classList.remove('active'));
                e.target.classList.add('active');
            }
        });

        // Tabs
        const tabs = document.querySelectorAll('.tab-link');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                document.querySelectorAll('.tab-link').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tabName).classList.add('active');
            });
        });

        // Quantity Selector
        const qtyInput = document.getElementById('quantity');
        document.getElementById('increase-qty').addEventListener('click', () => qtyInput.value++);
        document.getElementById('decrease-qty').addEventListener('click', () => {
            if (qtyInput.value > 1) qtyInput.value--;
        });
    };

    // --- Initial Load ---
    const loadPage = async () => {
        try {
            const productData = await getProductById(productId);
            const product = productData.data;
            renderProduct(product);
            const reviewsData = await getProductReviews(productId);
            renderReviews(reviewsData.data);
            setupEventListeners();
        } catch (error) {
            showToast("Erro ao carregar os detalhes do produto.", "error");
            document.querySelector('main.container').innerHTML = '<p>Produto não encontrado.</p>';
        }
    };

    loadPage();
});
