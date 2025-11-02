import { getProductById, getProductReviews, api } from "./services/api.js";

document.addEventListener("DOMContentLoaded", async () => {
    const mainImage = document.getElementById("main-product-image");
    const thumbnailGallery = document.getElementById("thumbnail-gallery");
    const productName = document.getElementById("product-name");
    const productPrice = document.getElementById("product-price");
    const productDescription = document.getElementById("product-description");
    const sellerAvatar = document.getElementById("seller-avatar");
    const sellerName = document.getElementById("seller-name");
    const sellerLocation = document.getElementById("seller-location");
    const quantityInput = document.getElementById("quantity-input");
    const quantityButtons = document.querySelectorAll(".btn-quantity");
    const addToCartBtn = document.getElementById("add-to-cart-btn");
    const wishlistBtn = document.getElementById("wishlist-btn");
    const commentForm = document.getElementById("comment-form");
    const commentsList = document.getElementById("comments-list");

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    if (!productId) {
        document.querySelector('main').innerHTML = '<p class="container">ID do produto não encontrado.</p>';
        return;
    }

    try {
        const [productData, reviewsData] = await Promise.all([
            getProductById(productId),
            getProductReviews(productId)
        ]);

        const product = productData?.data;
        const reviews = reviewsData?.data || [];

        if (product) {
            renderProductDetails(product);
            renderReviews(reviews);
        } else {
            document.querySelector('main').innerHTML = '<p class="container">Produto não encontrado.</p>';
        }
    } catch (error) {
        console.error("Erro ao carregar detalhes do produto:", error);
        document.querySelector('main').innerHTML = '<p class="container">Ocorreu um erro ao carregar o produto.</p>';
    }

    function renderProductDetails(product) {
        document.title = `${product.name} - Bazar Bié Okutuala`;
        mainImage.src = product.images?.[0] || 'assets/images/placeholders/product-main.png';
        productName.textContent = product.name;
        productPrice.textContent = parseFloat(product.price).toLocaleString("pt-AO", { style: 'currency', currency: 'AOA' });
        productDescription.textContent = product.description;

        if (product.seller) {
            sellerAvatar.src = product.seller.avatar_url || 'assets/images/placeholders/avatar.png';
            sellerName.textContent = product.seller.name;
            sellerName.href = `seller.html?id=${product.seller.id}`;
            sellerLocation.textContent = product.seller.location || 'Bié, Angola';
        }

        if (product.images && product.images.length > 0) {
            thumbnailGallery.innerHTML = product.images.map((img, index) => `
                <div class="thumbnail-item ${index === 0 ? 'active' : ''}" data-image-src="${img}">
                    <img src="${img}" alt="Thumbnail ${index + 1}">
                </div>
            `).join('');
        }
    }

    function renderReviews(reviews) {
        if (reviews.length === 0) {
            commentsList.innerHTML = '<p>Ainda não há comentários. Seja o primeiro a comentar!</p>';
            return;
        }
        commentsList.innerHTML = reviews.map(review => `
            <div class="comment">
                <img src="${review.user.avatar_url || 'assets/images/placeholders/avatar.png'}" alt="${review.user.name}" class="comment-avatar">
                <div class="comment-content">
                    <span class="comment-author">${review.user.name}</span>
                    <p class="comment-text">${review.comment}</p>
                    <div class="comment-actions">
                        <span>${new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    thumbnailGallery.addEventListener("click", e => {
        const thumbnail = e.target.closest('.thumbnail-item');
        if (thumbnail) {
            mainImage.src = thumbnail.dataset.imageSrc;
            document.querySelectorAll(".thumbnail-item").forEach(item => item.classList.remove("active"));
            thumbnail.classList.add("active");
        }
    });

    quantityButtons.forEach(button => {
        button.addEventListener("click", () => {
            const action = button.dataset.action;
            let quantity = parseInt(quantityInput.value);
            if (action === "increase") {
                quantity++;
            } else if (action === "decrease" && quantity > 1) {
                quantity--;
            }
            quantityInput.value = quantity;
        });
    });

    addToCartBtn.addEventListener("click", () => {
        const quantity = parseInt(quantityInput.value);
        showToast(`Adicionado ${quantity} item(s) ao carrinho!`);
    });

    wishlistBtn.addEventListener("click", async () => {
        try {
            await api.post("/wishlist", { productId });
            showToast("Produto adicionado aos favoritos!");
        } catch (error) {
            showToast("Erro ao adicionar aos favoritos.", "error");
        }
    });

    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const commentInput = e.target.querySelector('.comment-input');
        const commentText = commentInput.value.trim();

        if (commentText) {
            try {
                const newReview = await api.post(`/products/${productId}/reviews`, { comment: commentText });

                const newCommentElement = document.createElement('div');
                newCommentElement.classList.add('comment');
                newCommentElement.innerHTML = `
                    <img src="${newReview.data.user.avatar_url || 'assets/images/placeholders/avatar.png'}" alt="${newReview.data.user.name}" class="comment-avatar">
                    <div class="comment-content">
                        <span class="comment-author">${newReview.data.user.name}</span>
                        <p class="comment-text">${newReview.data.comment}</p>
                         <div class="comment-actions">
                            <span>Agora mesmo</span>
                        </div>
                    </div>
                `;

                if (commentsList.querySelector('p')) {
                    commentsList.innerHTML = '';
                }

                commentsList.prepend(newCommentElement);
                commentInput.value = '';

            } catch(err) {
                showToast('Ocorreu um erro ao publicar o seu comentário.', 'error');
            }
        }
    });
});
