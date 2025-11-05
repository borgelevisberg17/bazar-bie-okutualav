// frontend/public/assets/js/ui/quickView.js

import { getProductDetails } from '../services/api.js';
import { showToast } from '../notifications.js';

export function setupQuickView(postCard) {
    const quickViewBtn = postCard.querySelector('.quick-view-btn');
    const modal = document.getElementById('quick-view-modal');
    const modalContent = document.getElementById('quick-view-content');
    const closeModalBtn = document.getElementById('modal-close-btn');

    const openModal = () => modal.classList.add('active');
    const closeModal = () => modal.classList.remove('active');

    if (quickViewBtn) {
        quickViewBtn.addEventListener('click', async () => {
            const productId = quickViewBtn.dataset.productId;
            try {
                const productData = await getProductDetails(productId);
                const product = productData.data;
                const priceFormatted = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price);

                modalContent.innerHTML = `
                    <div class="quick-view-content-grid">
                        <div class="quick-view-image-gallery">
                            <img src="${product.all_images[0] || 'assets/images/placeholders/product.png'}" alt="${product.name}" class="quick-view-main-image">
                        </div>
                        <div class="quick-view-details">
                            <h2>${product.name}</h2>
                            <p class="quick-view-price">${priceFormatted}</p>
                            <p class="quick-view-description">${product.description}</p>
                            <button class="btn-add-to-cart" data-product-id="${product.id}">Adicionar ao Carrinho</button>
                        </div>
                    </div>
                `;
                openModal();
            } catch (error) {
                showToast("Erro ao carregar detalhes do produto.", "error");
            }
        });
    }

    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}
