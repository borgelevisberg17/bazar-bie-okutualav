/**
 * Inicializa a página de detalhes do produto, gerenciando renderização, eventos e estado.
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM carregado. Iniciando Bié Okutuala...');

    // --- Cache de Elementos DOM ---
    const dom = {
        mainImage: document.getElementById('mainImage'),
        thumbnails: document.getElementById('thumbnails'),
        productName: document.getElementById('productName'),
        productStars: document.getElementById('productStars'),
        productReviews: document.getElementById('productReviews'),
        productPrice: document.getElementById('productPrice'),
        oldPrice: document.getElementById('oldPrice'),
        newPrice: document.getElementById('newPrice'),
        productAvailability: document.getElementById('productAvailability'),
        quantityInput: document.getElementById('quantity'),
        addToCartBtn: document.getElementById('addToCartBtn'),
        buyNowBtn: document.getElementById('buyNowBtn'),
        wishlistBtn: document.getElementById('wishlistBtn'),
        shareBtn: document.getElementById('shareBtn'),
        productDescription: document.getElementById('productDescription'),
        productSpecs: document.getElementById('productSpecs'),
        sellerAvatar: document.getElementById('sellerAvatar'),
        sellerName: document.getElementById('sellerName'),
        sellerStars: document.getElementById('sellerStars'),
        customerReviews: document.getElementById('customerReviews'),
        relatedProducts: document.getElementById('relatedProducts'),
        categoryFilters: document.getElementById('categoryFilters'),
        loadingSpinner: document.getElementById('loadingSpinner'),
        toast: document.getElementById('toastNotification'),
        userActionsContainer: document.getElementById('userActions'),
        backBtn: document.getElementById('backBtn'),
        zoomModal: document.getElementById('imageZoomModal'),
        zoomImage: document.getElementById('zoomImage'),
        zoomClose: document.querySelector('.zoom-close'),
        themeToggle: document.getElementById('themeToggle'),
        voiceToggle: document.getElementById('voiceToggle'),
        breadcrumbCategory: document.getElementById('breadcrumbCategory'),
        shareModal: document.getElementById('shareModal'),
        shareClose: document.getElementById('shareCloseBtn'),
        copyLinkBtn: document.getElementById('copyLinkBtn')
    };

    // --- Verificações de Dependências Externas ---
    const isGsapAvailable = typeof gsap !== 'undefined';
    const isLucideAvailable = typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function';
    const isConfettiAvailable = typeof confetti !== 'undefined';

    // --- Estado Global ---
    let state = {
        cartItems: JSON.parse(localStorage.getItem('cartItems')) || [],
        wishlist: JSON.parse(localStorage.getItem('wishlist')) || [],
        isVoiceEnabled: localStorage.getItem('voiceEnabled') === 'true',
        currentPage: 1,
        productsPerPage: 4,
        isLoading: false,
        selectedCategory: 'all',
        products: [],
        sellers: [],
        reviews: []
    };

    // --- Funções Auxiliares ---

    /**
     * Função auxiliar para executar animações GSAP com fallback.
     * @param {Element|Element[]} target - Elemento(s) a animar.
     * @param {Object} from - Propriedades iniciais da animação.
     * @param {Object} to - Propriedades finais da animação.
     * @param {Function} [fallback] - Função de fallback se GSAP não estiver disponível.
     */
    const animateWithGsap = (target, from, to, fallback) => {
        if (!isGsapAvailable) {
            if (fallback) fallback();
            return;
        }
        try {
            gsap.fromTo(target, from, to);
        } catch (e) {
            console.error(`Erro na animação GSAP: ${e}`);
            if (fallback) fallback();
        }
    };

    /**
     * Exibe uma notificação toast.
     * @param {string} message - Mensagem a ser exibida.
     * @param {string} [type='success'] - Tipo do toast (success, error, info).
     */
    const showToast = (message, type = 'success') => {
        if (!dom.toast) {
            console.error('Elemento toast não encontrado');
            return;
        }
        dom.toast.textContent = message;
        dom.toast.className = `toast ${type}`;
        animateWithGsap(
            dom.toast,
            { y: 50, opacity: 0, scale: 0.9 },
            {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.4,
                ease: 'back.out(1.7)',
                onStart: () => dom.toast.classList.add('show'),
                onComplete: () => {
                    animateWithGsap(
                        dom.toast,
                        { y: 0, opacity: 1 },
                        {
                            y: 50,
                            opacity: 0,
                            duration: 0.3,
                            delay: 2.5,
                            ease: 'power2.in',
                            onComplete: () => dom.toast.classList.remove('show')
                        }
                    );
                }
            },
            () => {
                dom.toast.classList.add('show');
                setTimeout(() => dom.toast.classList.remove('show'), 3000);
            }
        );
        speak(message);
    };

    /**
     * Reproduz texto com síntese de voz, se habilitada.
     * @param {string} text - Texto a ser falado.
     */
    const speak = (text) => {
        if (!state.isVoiceEnabled || !window.speechSynthesis) return;
        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-PT';
            utterance.volume = 0.9;
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error('Falha na síntese de voz:', e);
        }
    };

    /**
     * Gera HTML para estrelas de avaliação.
     * @param {number} rating - Valor da avaliação (0 a 5).
     * @returns {string} HTML das estrelas.
     */
    const renderStars = (rating) => {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<i data-lucide="star" style="fill: ${i <= Math.round(rating) ? 'var(--color-star)' : 'none'}; color: var(--color-star);" aria-hidden="true"></i>`;
        }
        return stars;
    };

    /**
     * Inicializa ícones Lucide com fallback.
     */
    const initializeIcons = () => {
        if (!isLucideAvailable) {
            document.querySelectorAll('[data-lucide="star"]').forEach(svg => {
                svg.outerHTML = `<span class="star-icon" aria-hidden="true">${svg.dataset.lucide === 'star' ? '★' : ''}</span>`;
            });
            return;
        }
        try {
            lucide.createIcons();
            document.querySelectorAll('svg[data-lucide="star"]').forEach((svg, index) => {
                const isFilled = index < Math.round(parseFloat(svg.closest('.stars')?.dataset?.rating || 0));
                svg.style.fill = isFilled ? 'var(--color-star)' : 'none';
                svg.style.color = 'var(--color-star)';
            });
        } catch (e) {
            console.error('Falha ao inicializar ícones:', e);
        }
    };

    /**
     * Gera URLs para compartilhamento em redes sociais.
     * @param {string} url - URL do produto.
     * @param {string} title - Título do produto.
     * @returns {Object} URLs para WhatsApp, Facebook e Twitter.
     */
    const generateShareUrls = (url, title) => {
        return {
            whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
        };
    };

    /**
     * Abre o modal de compartilhamento.
     */
    const openShareModal = () => {
        if (!dom.shareModal) {
            console.error('Elemento shareModal não encontrado');
            return;
        }
        const url = window.location.href;
        const title = dom.productName?.textContent || 'Produto Bié Okutuala';
        const urls = generateShareUrls(url, title);
        const platforms = ['whatsapp', 'facebook', 'twitter'];
        platforms.forEach(platform => {
            const link = dom.shareModal.querySelector(`.${platform}`);
            if (link) link.href = urls[platform];
        });
        animateWithGsap(
            dom.shareModal,
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.4, ease: 'power3.out' },
            () => dom.shareModal.classList.add('show')
        );
    };

    /**
     * Fecha o modal de compartilhamento.
     */
    const closeShareModal = () => {
        if (!dom.shareModal) return;
        animateWithGsap(
            dom.shareModal,
            { scale: 1, opacity: 1 },
            { scale: 0.8, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => dom.shareModal.classList.remove('show') },
            () => dom.shareModal.classList.remove('show')
        );
    };

    /**
     * Animação para adicionar ao carrinho.
     * @param {Element} button - Botão que disparou a ação.
     */
    const animateAddToCart = (button) => {
        if (!dom.mainImage || !button) return;
        const clone = dom.mainImage.cloneNode(true);
        try {
            gsap.set(clone, {
                position: 'fixed',
                width: 60,
                height: 60,
                borderRadius: 12,
                zIndex: 1000,
                top: dom.mainImage.getBoundingClientRect().top,
                left: dom.mainImage.getBoundingClientRect().left
            });
        } catch (e) {
            console.error('Falha ao configurar clone da imagem:', e);
            return;
        }
        document.body.appendChild(clone);
        const cartRect = document.querySelector('#userActions .action-btn[title="Carrinho"] i')?.getBoundingClientRect();
        if (!cartRect) {
            clone.remove();
            return;
        }
        animateWithGsap(
            clone,
            { x: 0, y: 0, scale: 1, opacity: 1 },
            {
                x: cartRect.left - dom.mainImage.getBoundingClientRect().left,
                y: cartRect.top - dom.mainImage.getBoundingClientRect().top,
                scale: 0.3,
                opacity: 0,
                duration: 0.7,
                ease: 'power3.inOut',
                onComplete: () => clone.remove()
            }
        );
        if (isConfettiAvailable) {
            try {
                confetti({
                    particleCount: 120,
                    spread: 60,
                    origin: { x: dom.mainImage.getBoundingClientRect().left / window.innerWidth, y: dom.mainImage.getBoundingClientRect().top / window.innerHeight }
                });
            } catch (e) {
                console.error('Falha no confetti:', e);
            }
        }
    };

    /**
     * Atualiza o contador do carrinho.
     */
    const updateCartCount = () => {
        const cartCountEl = document.querySelector('.cart-badge');
        if (!cartCountEl) return;
        cartCountEl.textContent = state.cartItems.reduce((sum, item) => sum + item.quantity, 0);
        animateWithGsap(
            cartCountEl,
            { scale: 1 },
            { scale: 1.3, duration: 0.3, ease: 'elastic.out(1, 0.5)' }
        );
    };

    /**
     * Carrega dados do JSON.
     */
    const loadData = async () => {
        // Nothing to load initially
    };

    /**
     * Sanitiza HTML para evitar XSS (exemplo simples; usar DOMPurify em produção).
     * @param {string} html - HTML a ser sanitizado.
     * @returns {string} HTML sanitizado.
     */
    const sanitizeHTML = (html) => {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    };

    /**
     * Renderiza detalhes do produto.
     */
    const renderProductDetails = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        if (!productId) {
            if (dom.productName) dom.productName.textContent = 'Produto não encontrado';
            showToast('Produto não encontrado.', 'error');
            return;
        }

        try {
            const productData = await fetch(`${API_URL}/products/${productId}`).then(res => res.json());
            const product = productData.data;

            if (!product) {
                if (dom.productName) dom.productName.textContent = 'Produto não encontrado';
                showToast('Produto não encontrado.', 'error');
                return;
            }

            state.products = [product]; // Store the product in the state

            if (dom.mainImage) {
                dom.mainImage.src = product.images && product.images.length > 0 ? product.images[0].url : '../assets/background11.jpg';
                dom.mainImage.alt = product.name || 'Imagem do Produto';
            }
        } catch (error) {
            console.error('Erro ao carregar detalhes do produto:', error);
            showToast('Erro ao carregar detalhes do produto.', 'error');
        }
        const product = state.products[0];
        if (dom.thumbnails) {
            dom.thumbnails.innerHTML = '';
            if (product.images && product.images.length > 0) {
                product.images.forEach((img, index) => {
                    const thumbnail = document.createElement('img');
                    thumbnail.src = img.url || '../assets/background11.jpg';
                    thumbnail.alt = `${product.name} imagem ${index + 1}`;
                    thumbnail.className = `thumbnail ${index === 0 ? 'active' : ''}`;
                    thumbnail.loading = 'lazy';
                    dom.thumbnails.appendChild(thumbnail);
                });
                animateWithGsap(
                    '.thumbnail',
                    { x: -20, opacity: 0 },
                    { x: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power3.out', delay: 0.5 }
                );
            }
        }
        if (dom.productName) dom.productName.textContent = product.name || 'Produto Indisponível';
        if (dom.productStars) dom.productStars.innerHTML = renderStars(product.rating || 0);
        if (dom.productReviews) dom.productReviews.textContent = `(${product.reviews_count || 0} avaliações)`;
        if (dom.newPrice) dom.newPrice.textContent = `Kz ${(product.price || 0).toLocaleString('pt-AO')}`;
        if (dom.oldPrice) dom.oldPrice.style.display = 'none'; // No old price from backend yet
        if (dom.productAvailability) dom.productAvailability.textContent = product.stock > 0 ? 'Em stock' : 'Indisponível';
        if (dom.productDescription) dom.productDescription.textContent = product.description || 'Descrição indisponível';
        if (dom.productSpecs) {
            dom.productSpecs.innerHTML = ''; // No specs from backend yet
        }

        if (product.seller_id) {
            fetch(`${API_URL}/users/${product.seller_id}`)
                .then(res => res.json())
                .then(sellerData => {
                    if (sellerData.data) {
                        const seller = sellerData.data;
                        if (dom.sellerAvatar) {
                            dom.sellerAvatar.src = seller.avatar || '../assets/background11.jpg';
                            dom.sellerAvatar.alt = `Avatar de ${seller.name || 'Vendedor'}`;
                        }
                        if (dom.sellerName) dom.sellerName.textContent = seller.name || 'Vendedor Indisponível';
                        if (dom.sellerStars) dom.sellerStars.innerHTML = renderStars(seller.rating || 0);
                    }
                });
        }

        if (dom.customerReviews) {
            try {
                const reviewsRes = await fetch(`${API_URL}/reviews/product/${product.id}`);
                const reviews = await reviewsRes.json();
                if (reviewsRes.ok && reviews.length > 0) {
                    dom.customerReviews.innerHTML = reviews.map(r => `
                        <div class="customer-review">
                            <h4>${r.user_id}</h4>
                            <div class="stars">${renderStars(r.rating)}</div>
                            <p>${r.body}</p>
                        </div>
                    `).join('');
                    initializeIcons();
                } else {
                    dom.customerReviews.textContent = 'Sem avaliações ainda. Seja o primeiro!';
                }
            } catch (error) {
                console.error('Error fetching reviews:', error);
                dom.customerReviews.textContent = 'Erro ao carregar avaliações.';
            }
        }

        if (dom.wishlistBtn) {
            const isInWishlist = state.wishlist.includes(product.id);
            dom.wishlistBtn.classList.toggle('active', isInWishlist);
            const icon = dom.wishlistBtn.querySelector('i');
            if (icon) icon.style.fill = isInWishlist ? 'var(--color-brand-primary)' : 'none';
        }

        if (dom.breadcrumbCategory) {
            if (product.category_id) {
                fetch(`${API_URL}/categories/${product.category_id}`)
                    .then(res => res.json())
                    .then(categoryData => {
                        if (categoryData.data) {
                            dom.breadcrumbCategory.textContent = categoryData.data.name;
                        }
                    });
            } else {
                dom.breadcrumbCategory.textContent = 'Categoria Indisponível';
            }
        }

        animateWithGsap(
            ['.product-gallery', '.product-buy-box', '.product-buy-box .btn'],
            { x: -50, opacity: 0 },
            {
                x: 0,
                opacity: 1,
                stagger: 0.1,
                duration: 0.8,
                ease: 'elastic.out(1, 0.7)'
            }
        );

        speak(`Detalhes do produto: ${product.name}, por ${dom.newPrice?.textContent || 'preço indisponível'}`);
        initializeIcons();
    };

    /**
     * Renderiza filtros de categoria.
     */
    const renderCategoryFilters = () => {
        if (!dom.categoryFilters) {
            console.error('Elemento categoryFilters não encontrado');
            return;
        }
        const categories = ['all', ...new Set(state.products.map(p => p.category))];
        dom.categoryFilters.innerHTML = '';
        categories.forEach(cat => {
            const button = document.createElement('button');
            button.className = `filter-btn ${cat === state.selectedCategory ? 'active' : ''}`;
            button.dataset.category = cat;
            button.textContent = cat === 'all' ? 'Todos' : cat;
            dom.categoryFilters.appendChild(button);
        });
        animateWithGsap(
            '.filter-btn',
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'power3.out' }
        );
    };

    /**
     * Renderiza produtos relacionados.
     * @param {number} [page=1] - Página atual.
     * @param {string} [category='all'] - Categoria selecionada.
     */
    const renderRelatedProducts = async (page = 1, category = state.selectedCategory) => {
        if (!dom.relatedProducts) {
            console.error('Elemento relatedProducts não encontrado');
            return;
        }
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        if (!productId) {
            console.error('ID do produto inválido na URL');
            dom.relatedProducts.textContent = 'Erro ao carregar produtos relacionados.';
            return;
        }

        try {
            const currentProduct = state.products[0];
            let endpoint = `/products?limit=5`;
            if (currentProduct && currentProduct.category_id) {
                endpoint += `&category=${currentProduct.category_id}`;
            }
            const productsData = await fetch(API_URL + endpoint).then(res => res.json());
            let related = productsData.data.filter(p => p.id !== productId);

            if (related.length === 0) {
                dom.relatedProducts.textContent = 'Nenhum produto relacionado encontrado.';
                return;
            }

            if (page === 1) dom.relatedProducts.innerHTML = '';
            related.forEach(p => {
                const card = document.createElement('a');
                card.href = `product-details.html?id=${p.id}`;
                card.className = 'product-card';
                const imageUrl = p.images && p.images.length > 0 ? p.images[0].url : '../assets/background11.jpg';
                card.innerHTML = `
                    <div class="media">
                        <img src="${imageUrl}" alt="${sanitizeHTML(p.name)}" loading="lazy" onerror="this.src='../assets/background11.jpg';">
                        <div class="option-card">
                            <button class="add-to-cart-btn" data-id="${p.id}" aria-label="Adicionar ${sanitizeHTML(p.name)} ao Carrinho">
                                <i data-lucide="shopping-cart" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                    <div class="product-details">
                        <div class="p-info">
                            <div class="product-rating-r">
                                <div class="stars">${renderStars(p.rating || 0)}</div>
                                <span>(${p.reviews_count || 0})</span>
                            </div>
                        </div>
                        <p class="product-price">Kz ${(p.price || 0).toLocaleString('pt-AO')}</p>
                    </div>
                `;
                dom.relatedProducts.appendChild(card);
            });
            animateWithGsap(
                '.product-card',
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, stagger: 0.15, duration: 0.7, ease: 'power3.out' }
            );
            initializeIcons();
        } catch (error) {
            console.error('Erro ao carregar produtos relacionados:', error);
            dom.relatedProducts.textContent = 'Erro ao carregar produtos relacionados.';
        }
    };

    /**
     * Função de debounce para eventos.
     * @param {Function} func - Função a ser debounced.
     * @param {number} wait - Tempo de espera em milissegundos.
     * @returns {Function} Função debounced.
     */
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    };

    /**
     * Manipula o evento de scroll para carregamento infinito.
     */
    const handleScroll = () => {
        if (state.isLoading) return;
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        if (scrollTop + clientHeight >= scrollHeight - 200) {
            state.isLoading = true;
            if (dom.loadingSpinner) dom.loadingSpinner.classList.add('show');
            setTimeout(() => {
                state.currentPage++;
                renderRelatedProducts(state.currentPage, state.selectedCategory);
                if (dom.loadingSpinner) dom.loadingSpinner.classList.remove('show');
            }, 1000);
        }
    };
    const debouncedHandleScroll = debounce(handleScroll, 100);

    /**
     * Renderiza ações do usuário.
     */
    const renderUserActions = () => {
        if (!dom.userActionsContainer) {
            console.error('Elemento userActionsContainer não encontrado');
            return;
        }
        dom.userActionsContainer.innerHTML = `
            <button id="themeToggle" class="action-btn" title="Alternar Tema" aria-label="Alternar entre tema claro e escuro">
                <i data-lucide="sun" aria-hidden="true"></i>
                <i data-lucide="moon" style="display: none;" aria-hidden="true"></i>
            </button>
            <button id="voiceToggle" class="action-btn" title="Ativar/Desativar Voz" aria-label="Ativar ou Desligar Assistente de Voz">
                <i data-lucide="${state.isVoiceEnabled ? 'mic' : 'mic-off'}" aria-hidden="true"></i>
            </button>
            <a href="cart.html" class="action-btn" title="Carrinho" aria-label="Ver Carrinho">
                <i data-lucide="shopping-cart" aria-hidden="true"></i>
                ${state.cartItems.length ? `<span class="cart-badge">${state.cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>` : ''}
            </a>
        `;
        dom.themeToggle = document.getElementById('themeToggle');
        dom.voiceToggle = document.getElementById('voiceToggle');
        initializeIcons();
        animateWithGsap(
            '.action-btn',
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, stagger: 0.1, duration: 0.5, ease: 'elastic.out(1, 0.5)' }
        );
    };

    /**
     * Aplica o tema claro ou escuro.
     * @param {string} theme - Tema a ser aplicado ('light' ou 'dark').
     */
    const applyTheme = (theme) => {
        document.body.classList.toggle('dark-theme', theme === 'dark');
        const sunIcon = dom.themeToggle?.querySelector('[data-lucide="sun"]');
        const moonIcon = dom.themeToggle?.querySelector('[data-lucide="moon"]');
        if (sunIcon && moonIcon) {
            sunIcon.style.display = theme === 'dark' ? 'none' : 'block';
            moonIcon.style.display = theme === 'dark' ? 'block' : 'none';
        }
    };

    // --- Event Listeners ---
    if (dom.backBtn) {
        dom.backBtn.addEventListener('click', () => window.location.href = 'index.html');
    }

    if (dom.thumbnails) {
        dom.thumbnails.addEventListener('click', (e) => {
            const thumbnail = e.target.closest('.thumbnail');
            if (!thumbnail) return;
            document.querySelector('.thumbnail.active')?.classList.remove('active');
            thumbnail.classList.add('active');
            if (dom.mainImage) {
                animateWithGsap(
                    dom.mainImage,
                    { opacity: 1 },
                    {
                        opacity: 0,
                        duration: 0.3,
                        ease: 'power2.out',
                        onComplete: () => {
                            dom.mainImage.src = thumbnail.src;
                            animateWithGsap(
                                dom.mainImage,
                                { opacity: 0 },
                                { opacity: 1, duration: 0.3, ease: 'power2.in' }
                            );
                        }
                    },
                    () => dom.mainImage.src = thumbnail.src
                );
            }
        });
    }

    if (dom.quantityInput) {
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                let quantity = parseInt(dom.quantityInput.value) || 1;
                if (btn.dataset.action === 'increase') dom.quantityInput.value = quantity + 1;
                else if (btn.dataset.action === 'decrease' && quantity > 1) dom.quantityInput.value = quantity - 1;
                animateWithGsap(
                    dom.quantityInput,
                    { scale: 1 },
                    { scale: 1.2, duration: 0.2, ease: 'power2.out' }
                );
            });
        });
        dom.quantityInput.addEventListener('input', () => {
            if (dom.quantityInput.value < 1) dom.quantityInput.value = 1;
        });
    }

    if (dom.relatedProducts) {
        dom.relatedProducts.addEventListener('click', (e) => {
            const button = e.target.closest('.add-to-cart-btn');
            if (!button) return;
            const id = parseInt(button.dataset.id);
            const item = state.cartItems.find(item => item.id === id);
            if (item) item.quantity += 1;
            else state.cartItems.push({ id, quantity: 1 });
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
            updateCartCount();
            animateAddToCart(button);
            showToast('Adicionado ao carrinho!', 'success');
        });
    }

    if (dom.addToCartBtn) {
        dom.addToCartBtn.addEventListener('click', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const productId = urlParams.get('id');
            const quantity = parseInt(dom.quantityInput?.value || 1);
            let cart = JSON.parse(localStorage.getItem('cartItems')) || [];
            const item = cart.find(item => item.id == productId);
            if (item) {
                item.quantity += quantity;
            } else {
                cart.push({ id: productId, quantity: quantity });
            }
            localStorage.setItem('cartItems', JSON.stringify(cart));
            updateCartCount();
            animateAddToCart(dom.addToCartBtn);
            showToast('Adicionado ao carrinho!', 'success');
            renderUserActions();
        });
    }

    if (dom.buyNowBtn) {
        dom.buyNowBtn.addEventListener('click', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const productId = parseInt(urlParams.get('id'));
            const quantity = parseInt(dom.quantityInput?.value || 1);
            const item = state.cartItems.find(item => item.id === productId);
            if (item) item.quantity += quantity;
            else state.cartItems.push({ id: productId, quantity });
            localStorage.setItem('cartItems', JSON.stringify(state.cartItems));
            showToast('Indo para checkout!', 'success');
            setTimeout(() => window.location.href = 'checkout.html', 1000);
        });
    }

    if (dom.wishlistBtn) {
        dom.wishlistBtn.addEventListener('click', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const productId = parseInt(urlParams.get('id'));
            const isInWishlist = state.wishlist.includes(productId);
            if (isInWishlist) {
                state.wishlist = state.wishlist.filter(id => id !== productId);
                dom.wishlistBtn.classList.remove('active');
                const icon = dom.wishlistBtn.querySelector('i');
                if (icon) icon.style.fill = 'none';
                showToast('Removido da lista de desejos', 'info');
            } else {
                state.wishlist.push(productId);
                dom.wishlistBtn.classList.add('active');
                const icon = dom.wishlistBtn.querySelector('i');
                if (icon) icon.style.fill = 'var(--color-brand-primary)';
                showToast('Adicionado à lista de desejos!', 'success');
            }
            localStorage.setItem('wishlist', JSON.stringify(state.wishlist));
            animateWithGsap(
                dom.wishlistBtn.querySelector('i'),
                { scale: 1 },
                { scale: 1.5, duration: 0.3, ease: 'elastic.out(1, 0.5)' }
            );
        });
    }

    if (dom.shareBtn) {
        dom.shareBtn.addEventListener('click', () => {
            if (navigator.share) {
                const url = window.location.href;
                const title = dom.productName?.textContent || 'Produto Bié Okutuala';
                navigator.share({ title, url })
                    .then(() => showToast('Compartilhado!', 'success'))
                    .catch(() => showToast('Erro ao compartilhar', 'error'));
            } else {
                openShareModal();
            }
        });
    }

    if (dom.shareClose) {
        dom.shareClose.addEventListener('click', closeShareModal);
    }

    if (dom.copyLinkBtn) {
        dom.copyLinkBtn.addEventListener('click', () => {
            const url = window.location.href;
            navigator.clipboard.writeText(url)
                .then(() => showToast('Link copiado!', 'success'))
                .catch(() => showToast('Erro ao copiar link', 'error'));
            closeShareModal();
        });
    }

    if (dom.categoryFilters) {
        dom.categoryFilters.addEventListener('click', (e) => {
            const button = e.target.closest('.filter-btn');
            if (!button) return;
            document.querySelector('.filter-btn.active')?.classList.remove('active');
            button.classList.add('active');
            state.selectedCategory = button.dataset.category;
            state.currentPage = 1;
            renderRelatedProducts();
            window.removeEventListener('scroll', debouncedHandleScroll);
            window.addEventListener('scroll', debouncedHandleScroll);
            animateWithGsap(
                button,
                { scale: 1 },
                { scale: 1.2, duration: 0.3, ease: 'elastic.out(1, 0.5)' }
            );
        });
    }

    document.querySelectorAll('.accordion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const content = document.getElementById(btn.dataset.section);
            if (!content) return;
            const isActive = content.classList.contains('active');
            document.querySelectorAll('.accordion-content').forEach(c => {
                c.classList.remove('active');
                c.style.display = 'none';
                c.previousElementSibling.setAttribute('aria-expanded', 'false');
            });
            if (!isActive) {
                content.classList.add('active');
                content.style.display = 'block';
                btn.setAttribute('aria-expanded', 'true');
                animateWithGsap(
                    content,
                    { height: 0, opacity: 0 },
                    { height: 'auto', opacity: 1, duration: 0.6, ease: 'power3.out' }
                );
            }
        });
        if (btn.classList.contains('active')) {
            const content = document.getElementById(btn.dataset.section);
            if (content) {
                content.classList.add('active');
                content.style.display = 'block';
                btn.setAttribute('aria-expanded', 'true');
            }
        }
    });

    if (dom.mainImage && dom.zoomModal) {
        dom.mainImage.addEventListener('click', () => {
            if (dom.zoomImage) dom.zoomImage.src = dom.mainImage.src;
            animateWithGsap(
                dom.zoomModal,
                { scale: 0.8, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.4, ease: 'power3.out' },
                () => dom.zoomModal.classList.add('show')
            );
        });
    }

    if (dom.zoomClose) {
        dom.zoomClose.addEventListener('click', () => {
            animateWithGsap(
                dom.zoomModal,
                { scale: 1, opacity: 1 },
                { scale: 0.8, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => dom.zoomModal.classList.remove('show') },
                () => dom.zoomModal.classList.remove('show')
            );
        });
    }

    if (dom.themeToggle) {
        dom.themeToggle.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
            showToast(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado!`, 'success');
            animateWithGsap(
                'body',
                { opacity: 1 },
                { opacity: 0.8, duration: 0.3, ease: 'power2.out' }
            );
        });
    }

    if (dom.voiceToggle) {
        dom.voiceToggle.addEventListener('click', () => {
            state.isVoiceEnabled = !state.isVoiceEnabled;
            localStorage.setItem('voiceEnabled', state.isVoiceEnabled);
            const icon = dom.voiceToggle.querySelector('i');
            if (icon) icon.setAttribute('data-lucide', state.isVoiceEnabled ? 'mic' : 'mic-off');
            initializeIcons();
            showToast(`Assistente de voz ${state.isVoiceEnabled ? 'ativado' : 'desativado'}!`, 'info');
            speak(state.isVoiceEnabled ? 'Assistente de voz ativado.' : 'Assistente de voz desativado.');
        });
    }

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (dom.mainImage) {
            animateWithGsap(
                dom.mainImage,
                { y: 0 },
                { y: scrollY * 0.2, duration: 0.5, ease: 'power2.out' }
            );
        }
    });

    // --- Inicialização ---
    await loadData();
    renderProductDetails();
    renderCategoryFilters();
    renderRelatedProducts();
    renderUserActions();
    updateCartCount();
    applyTheme(localStorage.getItem('theme') || 'light');
    window.addEventListener('scroll', debouncedHandleScroll);
});