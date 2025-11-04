import { showToast } from "./notifications.js";
import { getProducts, getProductDetails } from "./services/api.js";

document.addEventListener("DOMContentLoaded", () => {
    const socialFeed = document.getElementById("social-feed");
    let currentPage = 1;
    const productsPerPage = 10;
    let isLoading = false;
    let hasMore = true;

    const loadProducts = async (page) => {
        if (isLoading || !hasMore) return;
        isLoading = true;

        try {
            const productsData = await getProducts(page, productsPerPage);
            const products = productsData?.data || [];

            if (products.length === 0) {
                hasMore = false;
                if(page === 1) {
                    socialFeed.innerHTML = "<p>Nenhum produto encontrado. Comece a seguir vendedores!</p>";
                }
            } else {
                renderProductPosts(products);
                currentPage++;
            }
            if (products.length < productsPerPage) {
                hasMore = false;
            }

        } catch (error) {
            showToast("Erro ao carregar o feed.", "error");
        } finally {
            isLoading = false;
        }
    };

    const renderProductPosts = (products) => {
        products.forEach(product => {
            const postCard = document.createElement("article");
            postCard.className = "product-post-card";
            const imageUrl = product.images && product.images.length > 0 ? product.images[0].image_url : 'assets/images/placeholders/product.png';
            const priceFormatted = new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(product.price);

            const images = product.images && product.images.length > 0 ? product.images : [{ image_url: 'assets/images/placeholders/product.png' }];
            const imageSlides = images.map(image => `
                <div class="carousel-slide">
                    <a href="product.html?id=${product.id}">
                        <img src="${image.image_url}" alt="${product.name}" class="product-image">
                    </a>
                </div>
            `).join('');

            const dots = images.map((_, index) => `<span class="dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></span>`).join('');

            postCard.innerHTML = `
                <div class="post-header">
                    <a href="seller.html?id=${product.seller?.id}">
                        <img src="${product.seller?.avatar_url || 'assets/images/placeholders/avatar.png'}" alt="${product.seller?.name}" class="seller-avatar">
                    </a>
                    <div class="seller-info">
                        <a href="seller.html?id=${product.seller?.id}" class="seller-name">${product.seller?.name}</a>
                    </div>
                </div>
                <div class="post-image-carousel">
                    <div class="carousel-track" style="transform: translateX(0%);">
                        ${imageSlides}
                    </div>
                    ${images.length > 1 ? `
                        <button class="carousel-btn prev"><i class="fas fa-chevron-left"></i></button>
                        <button class="carousel-btn next"><i class="fas fa-chevron-right"></i></button>
                        <div class="carousel-dots">${dots}</div>
                    ` : ''}
                    <button class="quick-view-btn" data-product-id="${product.id}"><i class="fas fa-eye"></i></button>
                </div>
                <div class="post-footer">
                    <div class="post-actions">
                        <div class="action-group">
                            <button class="action-btn" data-action="like" data-product-id="${product.id}"><i class="far fa-heart"></i></button>
                            <button class="action-btn" data-action="comment"><i class="far fa-comment"></i></button>
                            <button class="action-btn" data-action="share"><i class="far fa-paper-plane"></i></button>
                        </div>
                        <div class="action-group">
                            <span class="price">${priceFormatted}</span>
                            <button class="btn-add-to-cart" data-product-id="${product.id}">
                                <i class="fas fa-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="post-stats">
                        <span>${product.likes_count || 0} gostos</span>
                    </div>
                    <div class="post-description">
                        <a href="seller.html?id=${product.seller?.id}" class="seller-name">${product.seller?.name}</a>
                        <span class="product-name">${product.name}</span>
                    </div>
                    <a href="product.html?id=${product.id}#comments" class="view-comments">
                        Ver todos os ${product.comments_count || 0} comentários
                    </a>
                </div>
            `;
            socialFeed.appendChild(postCard);
            setupCarousel(postCard);
            setupQuickView(postCard);
        });
    };

    const setupCarousel = (postCard) => {
        const track = postCard.querySelector('.carousel-track');
        const slides = Array.from(track.children);
        const nextButton = postCard.querySelector('.carousel-btn.next');
        const prevButton = postCard.querySelector('.carousel-btn.prev');
        const dotsNav = postCard.querySelector('.carousel-dots');
        const dots = dotsNav ? Array.from(dotsNav.children) : [];
        if (slides.length === 0) return;
        const slideWidth = slides[0].getBoundingClientRect().width;

        let currentIndex = 0;

        const moveToSlide = (targetIndex) => {
            track.style.transform = `translateX(-${slideWidth * targetIndex}px)`;
            currentIndex = targetIndex;
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentIndex);
            });
        };

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                const newIndex = (currentIndex + 1) % slides.length;
                moveToSlide(newIndex);
            });
        }

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                const newIndex = (currentIndex - 1 + slides.length) % slides.length;
                moveToSlide(newIndex);
            });
        }

        if (dotsNav) {
            dotsNav.addEventListener('click', e => {
                const targetDot = e.target.closest('span.dot');
                if (!targetDot) return;
                const targetIndex = dots.findIndex(dot => dot === targetDot);
                moveToSlide(targetIndex);
            });
        }
    };

    const setupQuickView = (postCard) => {
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
    };

    const setupInfiniteScroll = () => {
        const sentinel = document.getElementById('sentinel') || document.createElement('div');
        sentinel.id = 'sentinel';
        socialFeed.insertAdjacentElement('afterend', sentinel);

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) {
                loadProducts(currentPage);
            }
        }, { threshold: 0.5 });

        observer.observe(sentinel);
    };

    loadProducts(currentPage);
    setupInfiniteScroll();
});
