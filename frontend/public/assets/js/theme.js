// js/checkout.js
document.addEventListener('DOMContentLoaded', async () => {
    try {
        lucide.createIcons();
    } catch (e) {
        console.error('Erro ao carregar ícones Lucide:', e);
    }

    // --- DOM Elements ---
    const cartItemsEl = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotal');
    const summaryItemsEl = document.getElementById('summaryItems');
    const summaryDiscountEl = document.getElementById('summaryDiscount');
    const summaryTotalEl = document.getElementById('summaryTotal');
    const orderItemCountEl = document.getElementById('orderItemCount');
    const orderDiscountEl = document.getElementById('orderDiscount');
    const orderTotalEl = document.getElementById('orderTotal');
    const orderDeliveryEl = document.getElementById('orderDelivery');
    const orderPaymentEl = document.getElementById('orderPayment');
    const deliveryForm = document.getElementById('deliveryForm');
    const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
    const paymentDetails = document.getElementById('paymentDetails');
    const promoCodeInput = document.getElementById('promoCode');
    const promoCodeError = document.getElementById('promoCodeError');
    const applyPromoBtn = document.querySelector('.apply-promo');
    const proceedToDeliveryBtn = document.getElementById('proceedToDelivery');
    const savePaymentBtn = document.getElementById('savePayment');
    const placeOrderBtn = document.getElementById('placeOrder');
    const placeOrderStickyBtn = document.getElementById('placeOrderSticky');
    const confirmationModal = document.getElementById('confirmationModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const toast = document.getElementById('toastNotification');
    const voiceToggleBtn = document.getElementById('voiceToggle');
    const deliveryEstimateEl = document.getElementById('deliveryEstimate');
    const progressSteps = document.querySelectorAll('.ring-step');
    const sections = {
        cart: document.getElementById('cartSection'),
        delivery: document.getElementById('deliverySection'),
        payment: document.getElementById('paymentSection'),
        review: document.getElementById('reviewSection'),
    };
    const response = await fetch("../database/data.json");
    const data = await response.json();
    
    // Verify DOM elements
    const requiredElements = { cartItemsEl, cartTotalEl, summaryItemsEl, deliveryForm, paymentDetails, proceedToDeliveryBtn, placeOrderBtn, confirmationModal, toast };
    for (const [key, el] of Object.entries(requiredElements)) {
        if (!el) console.error(`Elemento DOM não encontrado: ${key}`);
    }
    if (!voiceToggleBtn) console.warn('Botão voiceToggle não encontrado no DOM. Assistente de voz desativado.');

    // --- State ---
    let cart = JSON.parse(localStorage.getItem('cartItems'));
    let currentStep = 'cart';
    let appliedPromo = '';
    let isVoiceEnabled = localStorage.getItem('voiceEnabled') === 'true';
    const products = data.products;
    const validPromoCodes = {
        'BIE20OFF': 0.2, // 20% discount
        'ANGOLA10': 10000, // 10,000 Kz discount
    };

    console.log('Carrinho inicial:', cart);

    /**
     * Speaks a given text using the browser's speech synthesis API.
     * @param {string} text - The text to speak.
     */
    const speak = (text) => {
        if (!isVoiceEnabled || !window.speechSynthesis) return;
        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-PT';
            utterance.volume = 0.9;
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.error('Erro no assistente de voz:', e);
        }
    };

    if (voiceToggleBtn) {
        voiceToggleBtn.addEventListener('click', () => {
            isVoiceEnabled = !isVoiceEnabled;
            localStorage.setItem('voiceEnabled', isVoiceEnabled);
            voiceToggleBtn.setAttribute('aria-checked', isVoiceEnabled);
            const icon = voiceToggleBtn.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', isVoiceEnabled ? 'mic-off' : 'mic');
                try {
        lucide.createIcons();
    } catch (e) {
        console.error('Erro ao carregar ícones Lucide:', e);
    }
            } else {
                console.warn('Ícone dentro de voiceToggleBtn não encontrado.');
            }
            speak(isVoiceEnabled ? 'Assistente de voz ativado.' : 'Assistente de voz desativado.');
            showToast(`Assistente de voz ${isVoiceEnabled ? 'ativado' : 'desativado'}`, 'info');
        });
        voiceToggleBtn.setAttribute('aria-checked', isVoiceEnabled);
        const icon = voiceToggleBtn.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', isVoiceEnabled ? 'mic-off' : 'mic');
            try {
        lucide.createIcons();
    } catch (e) {
        console.error('Erro ao carregar ícones Lucide:', e);
    }
        }
    }

    /**
     * Shows a toast notification.
     * @param {string} message - The message to display.
     * @param {'success' | 'info' | 'error'} [type='success'] - The type of toast.
     */
    const showToast = (message, type = 'success') => {
        if (!toast) {
            console.error('Elemento toast não encontrado');
            return;
        }
        toast.textContent = message;
        toast.className = `toast show ${type}`;
        setTimeout(() => toast.classList.remove('show'), 3000);
        speak(message);
    };

    /**
     * Creates a debounced version of a function.
     * @param {Function} func - The function to debounce.
     * @param {number} wait - The debounce delay in milliseconds.
     * @returns {Function} The debounced function.
     */
    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    };

    /**
     * Updates the progress indicator and shows the current step.
     * @param {string} step - The current step ('cart', 'delivery', 'payment', 'review').
     */
    const updateProgress = (step) => {
        if (!progressSteps.length || !sections[step]) {
            console.error(`Erro ao atualizar progresso: etapa ${step} inválida`);
            return;
        }
        progressSteps.forEach((s) => {
            s.classList.remove('active', 'completed');
            const stepIndex = ['cart', 'delivery', 'payment', 'review'].indexOf(s.dataset.step);
            const currentIndex = ['cart', 'delivery', 'payment', 'review'].indexOf(step);
            if (s.dataset.step === step) {
                s.classList.add('active');
                try{
                gsap.to(s, { rotation: 0, z: 20, duration: 0.5 });
                }catch(e){
          console.error("erro ao carregar ",e);
        }
            } else if (stepIndex < currentIndex) {
                s.classList.add('completed');
                try{
                gsap.to(s, { rotation: 0, z: 0, duration: 0.5 });
                }catch(e){
          console.error("erro ao carregar ",e);
        }
            } else {
              try{
                gsap.to(s, { rotation: 0, z: 0, duration: 0.5 });
              }catch(e){
          console.error("erro ao carregar ",e);
        }
            }
        });
        Object.values(sections).forEach((s) => {
          try{
            gsap.to(s, { opacity: 0, y: 20, duration: 0.3, display: 'none' });
          }catch(e){
          console.error("erro ao carregar ",e);
        }
        });
        try{
        gsap.to(sections[step], { opacity: 1, y: 0, duration: 0.5, display: 'block' });
        }catch(e){
          console.error("erro ao carregar ",e);
        }
        currentStep = step;
        if (placeOrderStickyBtn) {
            placeOrderStickyBtn.style.display = step === 'review' ? 'block' : 'none';
        }
        speak(`Você está na etapa: ${step === 'cart' ? 'Carrinho' : step === 'delivery' ? 'Entrega' : step === 'payment' ? 'Pagamento' : 'Revisão'}`);
    };

    /**
     * Calculates the subtotal, discount, and total for the cart.
     * @returns {{subtotal: number, discountAmount: number, total: number}} The calculated totals.
     */
    const calculateTotal = () => {
        let subtotal = 0;
        cart.forEach((item) => {
            const product = products.find((p) => p.id === item.id);
            if (product) {
                subtotal += product.price * item.quantity;
            } else {
                console.warn(`Produto com ID ${item.id} não encontrado`);
            }
        });
        const discountAmount = appliedPromo && validPromoCodes[appliedPromo]
            ? isNaN(validPromoCodes[appliedPromo])
                ? subtotal * validPromoCodes[appliedPromo]
                : validPromoCodes[appliedPromo]
            : 0;
        return { subtotal, discountAmount, total: subtotal - discountAmount };
    };

    /**
     * Renders the cart items and summary.
     * @returns {boolean} True if the cart has items, false otherwise.
     */
    const renderCart = () => {
        if (!cartItemsEl || !summaryItemsEl) {
            console.error('Elementos do carrinho não encontrados');
            return false;
        }
        if (cart.length === 0) {
            cartItemsEl.innerHTML = '<p>Seu carrinho está vazio. <a href="index.html">Explore agora!</a></p>';
            summaryItemsEl.innerHTML = '<p>Sem itens.</p>';
            cartTotalEl.textContent = 'Kz 0';
            summaryDiscountEl.textContent = 'Kz 0';
            summaryTotalEl.textContent = 'Kz 0';
            orderItemCountEl.textContent = '0';
            orderDiscountEl.textContent = 'Kz 0';
            orderTotalEl.textContent = 'Kz 0';
            speak('Seu carrinho está vazio.');
            return false;
        }

        const { subtotal, discountAmount, total } = calculateTotal();
        cartItemsEl.innerHTML = cart
            .map((item) => {
                const product = products.find((p) => p.id === item.id);
                if (!product) return '';
                return `
                    <div class="cart-item" data-id="${item.id}">
                        <img src="${product.image}" alt="${product.name}" loading="lazy">
                        <div class="cart-item-info">
                            <h3>${product.name}</h3>
                            <p>Kz ${product.price.toLocaleString('pt-AO')} x ${item.quantity}</p>
                        </div>
                        <div class="quantity-control">
                            <button data-id="${item.id}" data-action="decrease" aria-label="Diminuir quantidade de ${product.name}">-</button>
                            <span>${item.quantity}</span>
                            <button data-id="${item.id}" data-action="increase" aria-label="Aumentar quantidade de ${product.name}">+</button>
                        </div>
                        <button class="remove-item" data-id="${item.id}" aria-label="Remover ${product.name}"><i data-lucide="trash-2"></i></button>
                    </div>
                `;
            })
            .join('');
        summaryItemsEl.innerHTML = cart
            .map((item) => {
                const product = products.find((p) => p.id === item.id);
                if (!product) return '';
                return `<div class="summary-item"><span>${product.name} x${item.quantity}</span><span>Kz ${(product.price * item.quantity).toLocaleString('pt-AO')}</span></div>`;
            })
            .join('');
        cartTotalEl.textContent = `Kz ${total.toLocaleString('pt-AO')}`;
        summaryDiscountEl.textContent = `Kz ${discountAmount.toLocaleString('pt-AO')}`;
        summaryTotalEl.textContent = `Kz ${total.toLocaleString('pt-AO')}`;
        orderItemCountEl.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        orderDiscountEl.textContent = `Kz ${discountAmount.toLocaleString('pt-AO')}`;
        orderTotalEl.textContent = `Kz ${total.toLocaleString('pt-AO')}`;
        try {
        lucide.createIcons();
    } catch (e) {
        console.error('Erro ao carregar ícones Lucide:', e);
    }
        try {
            gsap.from('.cart-item', { x: 50, opacity: 0, stagger: 0.1, duration: 0.5 });
        } catch (e) {
            console.error('Erro na animação GSAP do carrinho:', e);
        }
        return true;
    };

    /**
     * Toggles the color theme of the page.
     */
    const themeToggle = document.getElementById('themeToggle');
    const sunIcon = themeToggle?.querySelector('[data-lucide="sun"]');
    const moonIcon = themeToggle?.querySelector('[data-lucide="moon"]');
    /**
     * Applies a color theme to the page.
     * @param {'light' | 'dark'} theme - The theme to apply.
     */
    const applyTheme = (theme) => {
        document.body.classList.toggle('dark-theme', theme === 'dark');
        if (sunIcon && moonIcon) {
            sunIcon.style.display = theme === 'dark' ? 'none' : 'block';
            moonIcon.style.display = theme === 'dark' ? 'block' : 'none';
        }
    };
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
            showToast(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado`, 'info');
        });
        applyTheme(localStorage.getItem('theme') || 'light');
    }

    // --- Cart Management ---
    if (cartItemsEl) {
        cartItemsEl.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            const id = parseInt(target.dataset.id);
            let item = cart.find((i) => i.id === id);
            if (target.classList.contains('remove-item')) {
                cart = cart.filter((i) => i.id !== id);
                showToast('Item removido do carrinho', 'info');
            } else if (target.dataset.action === 'increase') {
                item.quantity += 1;
                showToast('Quantidade aumentada', 'info');
            } else if (target.dataset.action === 'decrease') {
                if (item.quantity > 1) {
                    item.quantity -= 1;
                    showToast('Quantidade diminuída', 'info');
                } else {
                    cart = cart.filter((i) => i.id !== id);
                    showToast('Item removido', 'info');
                }
            }
            localStorage.setItem('cartItems', JSON.stringify(cart));
            if (!renderCart()) {
                updateProgress('cart');
            }
        });
    }

    // --- Promo Code ---
    if (applyPromoBtn && promoCodeInput && promoCodeError) {
        applyPromoBtn.addEventListener('click', () => {
            const code = promoCodeInput.value.trim().toUpperCase();
            if (validPromoCodes[code]) {
                appliedPromo = code;
                promoCodeError.textContent = 'Código aplicado com sucesso!';
                promoCodeError.style.color = 'var(--success-color)';
                showToast('Código promocional aplicado!', 'success');
                renderCart();
            } else {
                appliedPromo = '';
                promoCodeError.textContent = 'Código inválido.';
                promoCodeError.style.color = 'var(--error-color)';
                showToast('Código inválido', 'error');
                renderCart();
            }
        });
    }

    // --- Proceed to Delivery ---
    if (proceedToDeliveryBtn) {
        proceedToDeliveryBtn.addEventListener('click', () => {
            if (renderCart()) {
                updateProgress('delivery');
            } else {
                showToast('Adicione itens ao carrinho antes de prosseguir', 'error');
            }
        });
    }

    /**
     * Validates a name.
     * @param {string} name - The name to validate.
     * @returns {string} An error message if invalid, otherwise an empty string.
     */
    const validateName = (name) => (name.trim().length >= 2 ? '' : 'Nome deve ter pelo menos 2 caracteres');

    /**
     * Validates a phone number.
     * @param {string} phone - The phone number to validate.
     * @returns {string} An error message if invalid, otherwise an empty string.
     */
    const validatePhone = (phone) => (/^\+?\d{9,}$/.test(phone.replace(/\s/g, '')) ? '' : 'Telefone inválido (ex.: +244 923 456 789)');

    /**
     * Validates an address.
     * @param {string} address - The address to validate.
     * @returns {string} An error message if invalid, otherwise an empty string.
     */
    const validateAddress = (address) => (address.trim().length >= 10 ? '' : 'Endereço deve ter pelo menos 10 caracteres');

    /**
     * Estimates the delivery time based on the address.
     * @param {string} address - The delivery address.
     */
    const estimateDelivery = debounce((address) => {
        if (!deliveryEstimateEl) return;
        const isLuanda = address.toLowerCase().includes('luanda');
        const days = isLuanda ? '2-3 dias úteis' : '5-7 dias úteis';
        deliveryEstimateEl.textContent = `Entrega estimada em ${days}`;
        speak(`Entrega estimada em ${days}`);
    }, 500);

    /**
     * Loads saved delivery details from localStorage.
     */
    const loadDeliveryDetails = () => {
        const saved = JSON.parse(localStorage.getItem('deliveryDetails')) || {};
        const fullNameEl = document.getElementById('fullName');
        const phoneEl = document.getElementById('phone');
        const addressEl = document.getElementById('address');
        const notesEl = document.getElementById('deliveryNotes');
        if (fullNameEl) fullNameEl.value = saved.fullName || '';
        if (phoneEl) phoneEl.value = saved.phone || '';
        if (addressEl) addressEl.value = saved.address || '';
        if (notesEl) notesEl.value = saved.notes || '';
        if (saved.address) estimateDelivery(saved.address);
    };

    loadDeliveryDetails();

    const addressInput = document.getElementById('address');
    if (addressInput) {
        addressInput.addEventListener('input', (e) => estimateDelivery(e.target.value));
    }

    if (deliveryForm) {
        deliveryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullName')?.value.trim() || '';
            const phone = document.getElementById('phone')?.value.trim() || '';
            const address = document.getElementById('address')?.value.trim() || '';
            const notes = document.getElementById('deliveryNotes')?.value.trim() || '';

            const errors = {
                fullName: validateName(fullName),
                phone: validatePhone(phone),
                address: validateAddress(address),
            };

            const fullNameError = document.getElementById('fullNameError');
            const phoneError = document.getElementById('phoneError');
            const addressError = document.getElementById('addressError');
            if (fullNameError) fullNameError.textContent = errors.fullName;
            if (phoneError) phoneError.textContent = errors.phone;
            if (addressError) addressError.textContent = errors.address;

            if (Object.values(errors).every((err) => !err)) {
                localStorage.setItem('deliveryDetails', JSON.stringify({ fullName, phone, address, notes }));
                if (orderDeliveryEl) {
                    orderDeliveryEl.textContent = `${fullName}, ${address}${notes ? ` (${notes})` : ''}`;
                }
                updateProgress('payment');
                showToast('Detalhes de entrega salvos!', 'success');
            } else {
                showToast('Corrija os erros no formulário', 'error');
            }
        });
    }

    // --- Payment Method Selection ---
    if (paymentMethods && paymentDetails) {
        paymentMethods.forEach((method) => {
            method.addEventListener('change', () => {
                const value = method.value;
                if (orderPaymentEl) {
                    orderPaymentEl.textContent = value === 'mpesa' ? 'M-Pesa' : value === 'card' ? 'Cartão Bancário' : 'Pagamento na Entrega';
                }
                paymentDetails.innerHTML = value === 'mpesa' ? `
                    <div class="form-group">
                        <p>Envie o pagamento para <strong>+244 197 411 197</strong> e insira o código abaixo:</p>
                        <label for="mpesaCode">Código da Transação</label>
                        <div class="input-wrapper">
                            <i data-lucide="smartphone"></i>
                            <input type="text" id="mpesaCode" placeholder="Ex.: 9876543210" required aria-label="Código da Transação M-Pesa">
                        </div>
                        <span class="error-message" id="mpesaCodeError"></span>
                    </div>
                ` : value === 'card' ? `
                    <div class="form-group">
                        <label for="cardNumber">Número do Cartão</label>
                        <div class="input-wrapper">
                            <i data-lucide="credit-card"></i>
                            <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" required aria-label="Número do Cartão">
                        </div>
                        <span class="error-message" id="cardNumberError"></span>
                    </div>
                    <div class="card-details">
                        <div class="form-group">
                            <label for="cardExpiry">Validade</label>
                            <div class="input-wrapper">
                                <input type="text" id="cardExpiry" placeholder="MM/AA" required aria-label="Validade do Cartão">
                            </div>
                            <span class="error-message" id="cardExpiryError"></span>
                        </div>
                        <div class="form-group">
                            <label for="cardCVC">CVC</label>
                            <div class="input-wrapper">
                                <input type="text" id="cardCVC" placeholder="123" required aria-label="CVC do Cartão">
                            </div>
                            <span class="error-message" id="cardCVCError"></span>
                        </div>
                    </div>
                ` : `
                    <p class="form-group">Pague ao receber os produtos. Verifique os itens antes do pagamento.</p>
                `;
                 try {
                lucide.createIcons();
                    gsap.from('.payment-details', { opacity: 0, y: 20, duration: 0.5 });
                } catch (e) {
                    console.error('Erro na animação GSAP do pagamento:', e);
                }
                showToast(`Método de pagamento selecionado: ${orderPaymentEl?.textContent || value}`, 'info');
            });
        });
    }

    // --- Save Payment ---
    if (savePaymentBtn) {
        savePaymentBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
            if (!selectedMethod) {
                showToast('Selecione um método de pagamento', 'error');
                return;
            }
            const paymentMethod = selectedMethod.value;
            let isValid = true;

            if (paymentMethod === 'mpesa') {
                const mpesaCode = document.getElementById('mpesaCode')?.value.trim();
                const error = mpesaCode && mpesaCode.length >= 8 ? '' : 'Código M-Pesa inválido (mínimo 8 caracteres)';
                const mpesaCodeError = document.getElementById('mpesaCodeError');
                if (mpesaCodeError) mpesaCodeError.textContent = error;
                isValid = !error;
            } else if (paymentMethod === 'card') {
                const cardNumber = document.getElementById('cardNumber')?.value.replace(/\s/g, '');
                const cardExpiry = document.getElementById('cardExpiry')?.value.trim();
                const cardCVC = document.getElementById('cardCVC')?.value.trim();
                const errors = {
                    cardNumber: cardNumber && cardNumber.length === 16 && /^\d+$/.test(cardNumber) ? '' : 'Número do cartão inválido',
                    cardExpiry: cardExpiry && /^\d{2}\/\d{2}$/.test(cardExpiry) ? '' : 'Validade inválida (ex.: 12/30)',
                    cardCVC: cardCVC && cardCVC.length === 3 && /^\d{3}$/.test(cardCVC) ? '' : 'CVC inválido',
                };
                const cardNumberError = document.getElementById('cardNumberError');
                const cardExpiryError = document.getElementById('cardExpiryError');
                const cardCVCError = document.getElementById('cardCVCError');
                if (cardNumberError) cardNumberError.textContent = errors.cardNumber;
                if (cardExpiryError) cardExpiryError.textContent = errors.cardExpiry;
                if (cardCVCError) cardCVCError.textContent = errors.cardCVC;
                isValid = Object.values(errors).every((err) => !err);
            }

            if (isValid) {
                updateProgress('review');
                showToast('Método de pagamento salvo!', 'success');
            } else {
                showToast('Corrija os erros no formulário', 'error');
            }
        });
    }

    /**
     * Launches a confetti animation.
     */
    const launchConfetti = () => {
        try {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#FF6B6B', '#4ECDC4', '#FFE66D'],
            });
        } catch (e) {
            console.error('Erro ao lançar confetti:', e);
        }
    };

    /**
     * Finalizes the order.
     */
    const placeOrder = () => {
        if (!renderCart()) {
            showToast('Carrinho vazio', 'error');
            updateProgress('cart');
            return;
        }
        const deliveryDetails = JSON.parse(localStorage.getItem('deliveryDetails')) || {};
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
        if (!deliveryDetails.fullName || !deliveryDetails.phone || !deliveryDetails.address) {
            showToast('Preencha os detalhes de entrega', 'error');
            updateProgress('delivery');
            return;
        }
        if (!paymentMethod) {
            showToast('Selecione um método de pagamento', 'error');
            updateProgress('payment');
            return;
        }
        if (confirmationModal) {
            confirmationModal.classList.add('visible');
            confirmationModal.setAttribute('aria-hidden', 'false');
            launchConfetti();
            showToast('Pedido confirmado com sucesso!', 'success');
            speak('Seu pedido foi confirmado! Obrigado por comprar no Bié Okutuala.');
            localStorage.removeItem('cartItems');
            localStorage.removeItem('deliveryDetails');
            localStorage.removeItem('appliedPromo');
        } else {
            console.error('Modal de confirmação não encontrado');
        }
    };

    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', placeOrder);
    }
    if (placeOrderStickyBtn) {
        placeOrderStickyBtn.addEventListener('click', placeOrder);
    }

    if (modalCloseBtn && confirmationModal) {
        modalCloseBtn.addEventListener('click', () => {
            confirmationModal.classList.remove('visible');
            confirmationModal.setAttribute('aria-hidden', 'true');
            try {
                gsap.to(confirmationModal, {
                    scale: 0.8,
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => {
                        window.location.href = 'index.html';
                    },
                });
            } catch (e) {
                console.error('Erro na animação GSAP do modal:', e);
                window.location.href = 'index.html';
            }
        });
    }

    // --- Initial Setup ---
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        showToast('Faça login para continuar', 'error');
        setTimeout(() => (window.location.href = 'login.html'), 1500);
        return;
    }

    try {
        renderCart();
        updateProgress('cart');
        speak('Bem-vindo à página de finalização de compra do Bié Okutuala!');
    } catch (e) {
        console.error('Erro na inicialização do checkout:', e);
    }
});
