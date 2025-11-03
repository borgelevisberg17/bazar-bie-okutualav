import { getProductById, api } from "./services/api.js";
import { showToast } from "./notifications.js";

document.addEventListener("DOMContentLoaded", async () => {
    // --- DOM Elements ---
    const mainProductImage = document.getElementById("main-product-image");
    const productNameEl = document.getElementById("product-name");
    const productPriceEl = document.getElementById("product-price");
    const productDescriptionEl = document.getElementById("product-description");
    const sellerAvatarEl = document.getElementById("seller-avatar");
    const sellerNameEl = document.getElementById("seller-name");
    const sellerLocationEl = document.getElementById("seller-location");
    const commentForm = document.getElementById("comment-form");
    const commentsListEl = document.getElementById("comments-list");
    const currentUserAvatar = document.querySelector('.current-user-avatar');

    // --- State ---
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");
    const userSession = JSON.parse(localStorage.getItem('user_session'));

    if (!productId) {
        document.querySelector('main').innerHTML = '<p class="container">ID do produto não encontrado.</p>';
        return;
    }

    if(userSession?.user?.avatar_url && currentUserAvatar) {
        currentUserAvatar.src = userSession.user.avatar_url;
    }

    // --- Functions ---
    const renderProductDetails = (product) => {
        document.title = `${product.name} - Bazar Bié Okutuala`;
        mainProductImage.src = product.images?.[0]?.image_url || 'assets/images/placeholders/product-main.png';
        productNameEl.textContent = product.name;
        productPriceEl.textContent = parseFloat(product.price).toLocaleString("pt-AO", { style: 'currency', currency: 'AOA' });
        productDescriptionEl.textContent = product.description;

        if (product.seller) {
            sellerAvatarEl.src = product.seller.avatar_url || 'assets/images/placeholders/avatar.png';
            sellerNameEl.textContent = product.seller.name;
            sellerNameEl.href = `seller.html?id=${product.seller.id}`;
            sellerLocationEl.textContent = product.seller.location || 'Bié, Angola';
        }
    };

    const renderComments = (comments) => {
        if (comments.length === 0) {
            commentsListEl.innerHTML = '<p>Seja o primeiro a comentar!</p>';
            return;
        }
        commentsListEl.innerHTML = comments.map(comment => `
            <div class="comment-item">
                <img src="${comment.user.avatar_url || 'assets/images/placeholders/avatar.png'}" alt="${comment.user.name}" class="comment-avatar">
                <div class="comment-content">
                    <div>
                        <a href="profile.html?id=${comment.user.id}" class="comment-author">${comment.user.name}</a>
                        <span class="comment-text">${comment.comment}</span>
                    </div>
                </div>
            </div>
        `).join('');
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        const commentInput = e.target.querySelector('.comment-input');
        const commentText = commentInput.value.trim();

        if (!commentText) return;

        try {
            const response = await api.post(`/products/${productId}/reviews`, { comment: commentText });
            const newComment = response.data;

            // Optimistic update
            const newCommentElement = document.createElement('div');
            newCommentElement.className = 'comment-item';
            newCommentElement.innerHTML = `
                <img src="${userSession.user.avatar_url || 'assets/images/placeholders/avatar.png'}" alt="${userSession.user.name}" class="comment-avatar">
                <div class="comment-content">
                     <div>
                        <a href="profile.html?id=${userSession.user.id}" class="comment-author">${userSession.user.name}</a>
                        <span class="comment-text">${newComment.comment}</span>
                    </div>
                </div>`;

            if(commentsListEl.querySelector('p')) {
                commentsListEl.innerHTML = '';
            }
            commentsListEl.prepend(newCommentElement);
            commentInput.value = '';
            showToast("Comentário publicado!", "success");

        } catch (error) {
            showToast("Erro ao publicar comentário.", "error");
        }
    };

    // --- Initial Load ---
    const loadPage = async () => {
        try {
            const productData = await getProductById(productId);
            const product = productData?.data;
            if (product) {
                renderProductDetails(product);
                renderComments(product.reviews || []);
            } else {
                document.querySelector('main').innerHTML = '<p class="container">Produto não encontrado.</p>';
            }
        } catch (error) {
            document.querySelector('main').innerHTML = '<p class="container">Ocorreu um erro ao carregar o produto.</p>';
        }
    };

    // --- Event Listeners ---
    commentForm.addEventListener('submit', handleCommentSubmit);

    // --- Run ---
    loadPage();
});
