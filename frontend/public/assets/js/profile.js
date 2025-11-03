import { api } from "./services/api.js";
import { showToast } from "./notifications.js";

document.addEventListener("DOMContentLoaded", () => {
    // --- DOM Elements ---
    const profileNameEl = document.getElementById("profile-name");
    const profileBioEl = document.getElementById("profile-bio");
    const profileAvatarEl = document.getElementById("profile-avatar");
    const coverPhotoEl = document.getElementById("cover-photo");
    const productsGridEl = document.getElementById("products-grid");
    const favoritesGridEl = document.getElementById("favorites-grid");
    const tabs = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- State ---
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get("id"); // May be null if viewing own profile
    const userSession = JSON.parse(localStorage.getItem('user_session'));
    const profileId = userId || userSession?.user?.id;

    if (!profileId) {
        document.querySelector('main').innerHTML = '<p class="container">Perfil não encontrado.</p>';
        return;
    }

    // --- Functions ---
    const renderUserProfile = (user) => {
        profileNameEl.textContent = user.name;
        profileBioEl.textContent = user.bio || 'Nenhuma bio disponível.';
        profileAvatarEl.src = user.avatar_url || 'assets/images/placeholders/user-avatar.png';
        coverPhotoEl.src = user.cover_photo_url || 'assets/images/placeholders/cover-photo.png';
        // TODO: Populate stats like follower counts when API is ready
    };

    const renderUserProducts = (products) => {
        if (products.length === 0) {
            productsGridEl.innerHTML = '<p>Este usuário ainda não publicou produtos.</p>';
            return;
        }
        // Re-using the social post card structure. For a real app, this would be a shared component.
        productsGridEl.innerHTML = products.map(product => {
             const imageUrl = product.images && product.images.length > 0 ? product.images[0].image_url : 'assets/images/placeholders/product.png';
             return `
                <article class="product-post-card">
                    <div class="post-image">
                        <a href="product.html?id=${product.id}">
                            <img src="${imageUrl}" alt="${product.name}" class="product-image">
                        </a>
                    </div>
                    <div class="post-footer">
                         <div class="post-description">
                            <span class="product-name">${product.name}</span>
                        </div>
                        <div class="post-stats">
                            <span>${parseFloat(product.price).toLocaleString("pt-AO", { style: 'currency', currency: 'AOA' })}</span>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    };

    const handleTabClick = (e) => {
        e.preventDefault();
        const clickedTab = e.currentTarget;
        const targetId = clickedTab.dataset.tab;

        tabs.forEach(tab => tab.classList.remove('active'));
        clickedTab.classList.add('active');

        tabContents.forEach(content => {
            if (content.id === targetId) {
                content.style.display = 'grid'; // or 'block' etc.
                content.classList.add('active');
            } else {
                content.style.display = 'none';
                content.classList.remove('active');
            }
        });
    };

    // --- Initial Load ---
    const loadPage = async () => {
        try {
            // Fetch user profile and products concurrently
            const [userResponse, productsResponse] = await Promise.all([
                api.get(`/users/${profileId}`),
                api.get(`/users/${profileId}/products`)
            ]);

            renderUserProfile(userResponse.data);
            renderUserProducts(productsResponse.data);

        } catch (error) {
            showToast("Erro ao carregar o perfil.", "error");
        }
    };

    // --- Event Listeners ---
    tabs.forEach(tab => tab.addEventListener('click', handleTabClick));

    // --- Run ---
    loadPage();
});
