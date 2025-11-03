import { getProductById, likeProduct, unlikeProduct, addComment } from './services/api.js';
import { showToast } from './notifications.js';
import { getUserSession } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const productId = new URLSearchParams(window.location.search).get('id');
    const currentUser = getUserSession()?.user;

    // Element selectors
    const productName = document.getElementById('product-name');
    const productPrice = document.getElementById('product-price');
    const productDescription = document.getElementById('product-description');
    const mainImage = document.getElementById('main-product-image');
    const thumbnailGallery = document.getElementById('thumbnail-gallery');
    const sellerAvatar = document.getElementById('seller-avatar');
    const sellerName = document.getElementById('seller-name');
    const sellerLink = document.getElementById('seller-link');
    const likeBtn = document.getElementById('like-btn');
    const commentsList = document.getElementById('comments-list');
    const commentForm = document.getElementById('comment-form');

    if (!productId) {
        // Handle error: no product ID
        document.querySelector('.product-details-layout').innerHTML = '<p>Produto não encontrado.</p>';
        return;
    }

    const renderProduct = (product) => {
        document.title = `${product.name} - Bazar Bié Okutuala`;
        productName.textContent = product.name;
        productPrice.textContent = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price);
        productDescription.textContent = product.description.substring(0, 150) + '...'; // Short description
        document.getElementById('product-long-description').textContent = product.description; // Full description

        // Seller info
        sellerName.textContent = product.seller.name;
        sellerAvatar.src = product.seller.avatar_url || 'assets/images/placeholders/avatar.png';
        sellerLink.href = `details/user.html?id=${product.seller.id}`;

        // Image gallery
        if (product.images && product.images.length > 0) {
            mainImage.src = product.images[0].image_url;
            thumbnailGallery.innerHTML = '';
            product.images.forEach(image => {
                const thumb = document.createElement('img');
                thumb.src = image.image_url;
                thumb.alt = 'Thumbnail do Produto';
                thumb.className = 'thumbnail-image';
                thumb.addEventListener('click', () => {
                    mainImage.src = image.image_url;
                });
                thumbnailGallery.appendChild(thumb);
            });
        }

        // Like button state
        updateLikeButton(product.is_liked);
        likeBtn.querySelector('span').textContent = `${product.likes_count} Gostos`;

        // Render comments
        renderComments(product.comments);
    };

    const updateLikeButton = (isLiked) => {
        likeBtn.dataset.liked = isLiked;
        if (isLiked) {
            likeBtn.innerHTML = '<i class="fas fa-heart"></i> Gostei';
            likeBtn.classList.add('liked');
        } else {
            likeBtn.innerHTML = '<i class="far fa-heart"></i> Gostar';
            likeBtn.classList.remove('liked');
        }
    };

    const handleLikeToggle = async () => {
        if (!currentUser) {
            showToast('Precisa de iniciar sessão para gostar de produtos.', 'info');
            return;
        }
        const isLiked = likeBtn.dataset.liked === 'true';
        likeBtn.disabled = true;
        try {
            const response = isLiked ? await unlikeProduct(productId) : await likeProduct(productId);
            updateLikeButton(!isLiked);
             likeBtn.querySelector('span').textContent = `${response.data.likes_count} Gostos`;
        } catch (error) {
            showToast('Ocorreu um erro ao processar a sua ação.', 'error');
        } finally {
            likeBtn.disabled = false;
        }
    };

    const renderComments = (comments) => {
        commentsList.innerHTML = '';
        if (comments && comments.length > 0) {
            comments.forEach(comment => {
                const commentElement = document.createElement('div');
                commentElement.className = 'comment';
                commentElement.innerHTML = `
                    <a href="details/user.html?id=${comment.user.id}">
                        <img src="${comment.user.avatar_url || 'assets/images/placeholders/avatar.png'}" alt="Avatar">
                    </a>
                    <div class="comment-content">
                        <p><strong>${comment.user.name}</strong> ${comment.content}</p>
                        <small>${new Date(comment.created_at).toLocaleString('pt-AO')}</small>
                    </div>
                `;
                commentsList.appendChild(commentElement);
            });
        } else {
            commentsList.innerHTML = '<p>Ainda não há comentários. Seja o primeiro a comentar!</p>';
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) {
            showToast('Precisa de iniciar sessão para comentar.', 'info');
            return;
        }
        const input = commentForm.querySelector('.comment-input');
        const content = input.value.trim();
        if (!content) return;

        try {
            const response = await addComment(productId, content);
            // Add the new comment to the top of the list
            const newComment = response.data;
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                <a href="details/user.html?id=${newComment.user.id}">
                    <img src="${newComment.user.avatar_url || 'assets/images/placeholders/avatar.png'}" alt="Avatar">
                </a>
                <div class="comment-content">
                    <p><strong>${newComment.user.name}</strong> ${newComment.content}</p>
                    <small>${new Date(newComment.created_at).toLocaleString('pt-AO')}</small>
                </div>
            `;
            // If it's the first comment, remove the placeholder text
            if(commentsList.querySelector('p')) {
                commentsList.innerHTML = '';
            }
            commentsList.prepend(commentElement);
            input.value = '';

        } catch(error) {
             showToast('Erro ao publicar comentário.', 'error');
        }
    };

    const init = async () => {
        try {
            const response = await getProductById(productId);
            renderProduct(response.data);
        } catch (error) {
            showToast('Não foi possível carregar os detalhes do produto.', 'error');
            document.querySelector('.product-details-layout').innerHTML = '<p class="text-center error">Ocorreu um erro ao carregar este produto.</p>';
        }
    };

    likeBtn.addEventListener('click', handleLikeToggle);
    commentForm.addEventListener('submit', handleCommentSubmit);
    init();
});
