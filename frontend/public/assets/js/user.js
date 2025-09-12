// js/user.js
document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userLocation = document.getElementById('userLocation');
    const userStars = document.getElementById('userStars');
    const userReviews = document.getElementById('userReviews');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const ordersList = document.getElementById('ordersList');
    const wishlistItems = document.getElementById('wishlistItems');
    const listingsItems = document.getElementById('listingsItems');
    const messagesList = document.getElementById('messagesList');
    const themeToggle = document.getElementById('themeToggle');
    const voiceToggle = document.getElementById('voiceToggle');
    const notificationsToggle = document.getElementById('notificationsToggle');
    const deliveryAddress = document.getElementById('deliveryAddress');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const editProfileModal = document.getElementById('editProfileModal');
    const newListingModal = document.getElementById('newListingModal');
    const messageModal = document.getElementById('messageModal');
    const toast = document.getElementById('toastNotification');
    const userActionsContainer = document.getElementById('userActions');

    // Data (simulada, integrar com backend real)
    const response = await fetch("../database/users.json");
    const data = await response.json();
    const products = await data.products; 

    let user = JSON.parse(localStorage.getItem('currentUser')) || {
        id: 1,
        name: 'Kuzola Man',
        avatar: 'https://getavataaars.com/?avatarStyle=Circle&topType=ShortHairShortFlat&hairColor=BrownDark&clotheType=ShirtCrewNeck&clotheColor=PastelBlue&eyeType=Default&mouthType=Smile&skinColor=Light',
        location: 'Luanda, Angola',
        rating: 4.8,
        reviews: 15,
        joined: 'Jan 2024',
    };

    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
    let isVoiceEnabled = localStorage.getItem('voiceEnabled') === 'true';
    let orders = JSON.parse(localStorage.getItem('orders')) || [
        { id: 1, productId: 1, date: '2025-06-01', status: 'Entregue', quantity: 1 },
        { id: 2, productId: 2, date: '2025-05-20', status: 'Em Trânsito', quantity: 2 },
    ];
    let listings = JSON.parse(localStorage.getItem('listings')) || [
        { id: 3, name: 'Sofá 3 Lugares', price: 180000, category: 'Móveis', images: ['https://images.pexels.com/photos/147411/pexels-photo-147411.jpeg'], userId: 1 },
    ];
    let messages = JSON.parse(localStorage.getItem('messages')) || [
        { id: 1, from: 'Ana P.', avatar: 'https://getavataaars.com/?avatarStyle=Circle&topType=LongHairMiaWallace&hairColor=Blonde&clotheType=BlazerShirt&clotheColor=Black&eyeType=Happy&mouthType=Smile&skinColor=Light', preview: 'O iPhone está disponível?', date: '2025-06-09' },
    ];

    // Helpers
    const showToast = (message, type = 'success') => {
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 3000);
        if (isVoiceEnabled) speak(message);
    };

    const speak = (text) => {
        if (!window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-PT';
        utterance.volume = 0.9;
        window.speechSynthesis.speak(utterance);
    };

    const renderStars = (rating) => {
        return Array(5).fill().map((_, i) => `
            <i data-lucide="star" style="fill: ${i < Math.round(rating) ? 'var(--star-color)' : 'none'}; color: var(--star-color);"></i>
        `).join('');
    };

    const initializeIcons = () => {
        try {
            lucide.createIcons();
        } catch (e) {
            console.error('Erro ao inicializar ícones:', e);
        }
    };

    const updateCartCount = () => {
        const cartCountEl = document.querySelector('.cart-badge');
        if (cartCountEl) {
            cartCountEl.textContent = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        }
    };

    // Render Functions
    const renderUserInfo = () => {
        userAvatar.src = user.avatar;
        userAvatar.alt = user.name;
        userName.textContent = user.name;
        userLocation.textContent = `${user.location} • Membro desde ${user.joined}`;
        userStars.innerHTML = renderStars(user.rating);
        userReviews.textContent = `(${user.reviews})`;
        initializeIcons();
    };

    const renderOrders = () => {
        ordersList.innerHTML = orders.map(order => {
            const product = products.find(p => p.id === order.productId);
            return product ? `
                <div class="order-item">
                    <img src="${product.images[0]}" alt="${product.name}">
                    <div class="order-details">
                        <h3>${product.name}</h3>
                        <p>Data: ${order.date}</p>
                        <p class="order-status">${order.status}</p>
                    </div>
                    <div class="order-actions">
                        <button class="btn btn-secondary btn-view-order" data-id="${order.id}">Detalhes</button>
                        <button class="btn btn-primary btn-reorder" data-id="${order.productId}">Comprar Novamente</button>
                    </div>
                </div>
            ` : '';
        }).join('');
        initializeIcons();
        gsap.from('.order-item', { opacity: 0, y: 20, stagger: 0.1, duration: 0.6 });
    };

    const renderWishlist = () => {
        wishlistItems.innerHTML = wishlist.map(id => {
            const product = products.find(p => p.id === id);
            return product ? `
                <div class="product-card">
                    <img src="${product.images[0]}" alt="${product.name}">
                    <div class="product-details">
                        <h3>${product.name}</h3>
                        <p class="product-price">Kz ${product.price.toLocaleString('pt-AO')}</p>
                        <button class="btn btn-primary btn-add-to-cart" data-id="${product.id}">Adicionar ao Carrinho</button>
                        <button class="btn btn-secondary btn-remove-wishlist" data-id="${product.id}">Remover</button>
                    </div>
                </div>
            ` : '';
        }).join('') || '<p>Sua lista de desejos está vazia.</p>';
        initializeIcons();
        gsap.from('.product-card', { opacity: 0, y: 20, stagger: 0.1, duration: 0.6 });
    };

    const renderListings = () => {
        listingsItems.innerHTML = listings.map(listing => `
            <div class="product-card">
                <img src="${listing.images[0]}" alt="${listing.name}">
                <div class="product-details">
                    <h3>${listing.name}</h3>
                    <p class="product-price">Kz ${listing.price.toLocaleString('pt-AO')}</p>
                    <button class="btn btn-secondary btn-edit-listing" data-id="${listing.id}">Editar</button>
                    <button class="btn btn-secondary btn-delete-listing" data-id="${listing.id}">Excluir</button>
                </div>
            </div>
        `).join('') || '<p>Você não tem anúncios.</p>';
        initializeIcons();
        gsap.from('.product-card', { opacity: 0, y: 20, stagger: 0.1, duration: 0.6 });
    };

    const renderMessages = () => {
        messagesList.innerHTML = messages.map(message => `
            <div class="message-item" data-id="${message.id}">
                <img src="${message.avatar}" alt="${message.from}">
                <div class="message-details">
                    <h3>${message.from}</h3>
                    <p class="message-preview">${message.preview}</p>
                    <p>${message.date}</p>
                </div>
            </div>
        `).join('') || '<p>Sem mensagens.</p>';
        initializeIcons();
        gsap.from('.message-item', { opacity: 0, y: 20, stagger: 0.1, duration: 0.6 });
    };

    const renderSettings = () => {
        themeToggle.checked = localStorage.getItem('theme') === 'dark';
        voiceToggle.checked = isVoiceEnabled;
        notificationsToggle.checked = localStorage.getItem('notifications') === 'true';
        deliveryAddress.value = localStorage.getItem('deliveryAddress') || '';
    };

    const renderUserActions = () => {
        userActionsContainer.innerHTML = `
            <button class="action-btn" title="Alternar Tema" data-action="theme-toggle">
                <i data-lucide="${document.body.classList.contains('dark-theme') ? 'sun' : 'moon'}"></i>
            </button>
            <button class="action-btn" title="Voz" data-action="voice-toggle">
                <i data-lucide="${isVoiceEnabled ? 'mic' : 'mic-off'}"></i>
            </button>
            <a href="checkout.html" class="action-btn" title="Carrinho">
                <i data-lucide="shopping-cart"></i>
                ${cartItems.length ? `<span class="cart-badge">${cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>` : ''}
            </a>
        `;
        initializeIcons();
    };

    // Event Listeners
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-btn.active').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.section.active').forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.section).classList.add('active');
            gsap.from(`#${btn.dataset.section}`, { opacity: 0, y: 20, duration: 0.6 });
        });
    });

    editProfileBtn.addEventListener('click', () => {
        editProfileModal.style.display = 'flex';
        document.getElementById('profileName').value = user.name;
        document.getElementById('profileLocation').value = user.location;
        gsap.from('.modal-content', { scale: 0.8, opacity: 0, duration: 0.3 });
    });

    document.querySelectorAll('.modal-close').forEach(close => {
        close.addEventListener('click', () => {
            close.closest('.modal').style.display = 'none';
        });
    });

    document.getElementById('editProfileForm').addEventListener('submit', (e) => {
        e.preventDefault();
        user.name = document.getElementById('profileName').value;
        user.location = document.getElementById('profileLocation').value;
        const avatarFile = document.getElementById('profileAvatar').files[0];
        if (avatarFile) {
            user.avatar = URL.createObjectURL(avatarFile);
        }
        localStorage.setItem('user', JSON.stringify(user));
        renderUserInfo();
        editProfileModal.style.display = 'none';
        showToast('Perfil atualizado com ginga!', 'success');
    });

    document.getElementById('newListingBtn').addEventListener('click', () => {
        newListingModal.style.display = 'flex';
        gsap.from('.modal-content', { scale: 0.8, opacity: 0, duration: 0.3 });
    });

    document.getElementById('newListingForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const newListing = {
            id: listings.length + 1,
            name: document.getElementById('listingName').value,
            price: parseInt(document.getElementById('listingPrice').value),
            category: document.getElementById('listingCategory').value,
            images: ['https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg'], // Simulado
            userId: user.id,
        };
        listings.push(newListing);
        localStorage.setItem('listings', JSON.stringify(listings));
        renderListings();
        newListingModal.style.display = 'none';
        showToast('Anúncio criado com kuzola!', 'success');
    });

    messagesList.addEventListener('click', (e) => {
        const item = e.target.closest('.message-item');
        if (item) {
            messageModal.style.display = 'flex';
            const messageId = parseInt(item.dataset.id);
            const message = messages.find(m => m.id === messageId);
            document.getElementById('messageContent').innerHTML = `
                <div class="message-item">
                    <img src="${message.avatar}" alt="${message.from}">
                    <div class="message-details">
                        <h3>${message.from}</h3>
                        <p>${message.preview}</p>
                    </div>
                </div>
            `;
            gsap.from('.modal-content', { scale: 0.8, opacity: 0, duration: 0.3 });
        }
    });

    document.getElementById('sendMessageForm').addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Mensagem enviada com mboa!', 'success');
        messageModal.style.display = 'none';
    });

    saveSettingsBtn.addEventListener('click', () => {
        localStorage.setItem('theme', themeToggle.checked ? 'dark' : 'light');
        localStorage.setItem('voiceEnabled', voiceToggle.checked);
        localStorage.setItem('notifications', notificationsToggle.checked);
        localStorage.setItem('deliveryAddress', deliveryAddress.value);
        document.body.classList.toggle('dark-theme', themeToggle.checked);
        isVoiceEnabled = voiceToggle.checked;
        showToast('Configurações salvas com ginga!', 'success');
        renderUserActions();
    });

    ordersList.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-reorder')) {
            const productId = parseInt(e.target.dataset.id);
            cartItems.push({ id: productId, quantity: 1 });
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            updateCartCount();
            showToast('Adicionado ao carrinho com kuzola!', 'success');
            renderUserActions();
        }
    });

    wishlistItems.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-add-to-cart')) {
            const productId = parseInt(e.target.dataset.id);
            cartItems.push({ id: productId, quantity: 1 });
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            updateCartCount();
            showToast('Adicionado ao carrinho com ginga!', 'success');
        } else if (e.target.classList.contains('btn-remove-wishlist')) {
            const productId = parseInt(e.target.dataset.id);
            wishlist = wishlist.filter(id => id !== productId);
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
            renderWishlist();
            showToast('Removido da lista de desejos', 'info');
        }
    });

    listingsItems.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete-listing')) {
            const listingId = parseInt(e.target.dataset.id);
            listings = listings.filter(l => l.id !== listingId);
            localStorage.setItem('listings', JSON.stringify(listings));
            renderListings();
            showToast('Anúncio excluído', 'info');
        }
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('isLoggedIn');
        showToast('Até já, mano!', 'info');
        setTimeout(() => window.location.href = 'index.html', 1000);
    });

    userActionsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;
        if (btn.dataset.action === 'theme-toggle') {
            document.body.classList.toggle('dark-theme');
            localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
            btn.querySelector('i').setAttribute('data-lucide', document.body.classList.contains('dark-theme') ? 'sun' : 'moon');
            initializeIcons();
            showToast(`Tema ${document.body.classList.contains('dark-theme') ? 'escuro' : 'claro'} ativado!`, 'info');
        } else if (btn.dataset.action === 'voice-toggle') {
            isVoiceEnabled = !isVoiceEnabled;
            localStorage.setItem('voiceEnabled', isVoiceEnabled);
            btn.querySelector('i').setAttribute('data-lucide', isVoiceEnabled ? 'mic' : 'mic-off');
            initializeIcons();
            showToast(`Voz ${isVoiceEnabled ? 'ativada' : 'desativada'} com mboa!`, 'info');
            speak(`Voz ${isVoiceEnabled ? 'ativada' : 'desativada'}.`);
        }
    });

    // Initialize
    renderUserInfo();
    renderOrders();
    renderWishlist();
    renderListings();
    renderMessages();
    renderSettings();
    renderUserActions();
    updateCartCount();
    localStorage.getItem('theme') === 'dark' && document.body.classList.add('dark-theme');
});