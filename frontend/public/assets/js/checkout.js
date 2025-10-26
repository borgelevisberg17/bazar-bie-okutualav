// js/checkout.js
document.addEventListener('DOMContentLoaded', async () => {
    // --- Cache de DOM Elements ---
    const dom = {
        cartItemsEl: document.getElementById('cartItems'),
        cartTotalEl: document.getElementById('cartTotal'),
        summaryItemsEl: document.getElementById('summaryItems'),
        summaryDiscountEl: document.getElementById('summaryDiscount'),
        summaryTotalEl: document.getElementById('summaryTotal'),
        orderItemCountEl: document.getElementById('orderItemCount'),
        orderDiscountEl: document.getElementById('orderDiscount'),
        orderTotalEl: document.getElementById('orderTotal'),
        orderDeliveryEl: document.getElementById('orderDelivery'),
        orderPaymentEl: document.getElementById('orderPayment'),
        deliveryForm: document.getElementById('deliveryForm'),
        paymentMethods: document.querySelectorAll('input[name="paymentMethod"]'),
        paymentDetails: document.getElementById('paymentDetails'),
        promoCodeInput: document.getElementById('promoCode'),
        promoCodeError: document.getElementById('promoCodeError'),
        applyPromoBtn: document.querySelector('.apply-promo'),
        proceedToDeliveryBtn: document.getElementById('proceedToDelivery'),
        savePaymentBtn: document.getElementById('savePayment'),
        placeOrderBtn: document.getElementById('placeOrder'),
        placeOrderStickyBtn: document.getElementById('placeOrderSticky'),
        confirmationModal: document.getElementById('confirmationModal'),
        modalCloseBtn: document.getElementById('modalCloseBtn'),
        toast: document.getElementById('toastNotification'),
        voiceToggleBtn: document.getElementById('voiceToggle'),
        deliveryEstimateEl: document.getElementById('deliveryEstimate'),
        progressSteps: document.querySelectorAll('.ring-step'),
        clearCartBtn: document.getElementById('clearCartBtn'), // Novo: Botão para limpar carrinho
        sections: {
            cart: document.getElementById('cartSection'),
            delivery: document.getElementById('deliverySection'),
            payment: document.getElementById('paymentSection'),
            review: document.getElementById('reviewSection'),
        },
    };

    // --- Estado Centralizado ---
    const state = {
        cart: JSON.parse(localStorage.getItem('cartItems')) || [],
        currentStep: 'cart',
        appliedPromo: '',
        isVoiceEnabled: localStorage.getItem('voiceEnabled') === 'true',
        products: [],
        validPromoCodes: {
            'BIE20OFF': 0.2, // 20% discount
            'ANGOLA10': 10000, // 10,000 Kz discount
        },
    };

    /**
     * Loads product data from the API.
     * @returns {Promise<void>}
     */
    const loadData = async () => {
        try {
            const productsData = await fetch(`${API_URL}/products?limit=1000`).then(res => res.json());
            state.products = productsData.data || [];
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            showToast("Erro ao carregar dados do produto.", "error");
        }
    };

    /**
     * Shows a toast notification.
     * @param {string} message - The message to display.
     * @param {'success' | 'info' | 'error'} [type='success'] - The type of toast.
     */
    const showToast = (message, type = 'success') => {
        if (!dom.toast) return;
        dom.toast.textContent = message;
        dom.toast.className = `toast show ${type}`;
        setTimeout(() => dom.toast.classList.remove('show'), 3000);
        speak(message);
    };

    /**
     * Speaks a given text using the browser's speech synthesis API.
     * @param {string} text - The text to speak.
     */
    const speak = (text) => {
        if (!state.isVoiceEnabled || !window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-PT';
        utterance.volume = 0.9;
        window.speechSynthesis.speak(utterance);
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
        if (!dom.progressSteps.length || !dom.sections[step]) return;
        dom.progressSteps.forEach((s) => {
            s.classList.remove('active', 'completed');
            const stepIndex = ['cart', 'delivery', 'payment', 'review'].indexOf(s.dataset.step);
            const currentIndex = ['cart', 'delivery', 'payment', 'review'].indexOf(step);
            if (s.dataset.step === step) s.classList.add('active');
            else if (stepIndex < currentIndex) s.classList.add('completed');
        });
        Object.values(dom.sections).forEach((s) => {
          try{
            gsap.set(s, { opacity: 0, y: 20, display: 'none' });
          }catch(e){
            console.error("erro ao carregar ",e);
          }
        });
        try{
        gsap.to(dom.sections[step], { opacity: 1, y: 0, duration: 0.5, display: 'block' });
        }catch(e){
            console.error("erro ao carregar ",e);
          }
        state.currentStep = step;
        if (dom.placeOrderStickyBtn) {
            dom.placeOrderStickyBtn.style.display = step === 'review' ? 'block' : 'none';
        }
        speak(`Você está na etapa: ${step === 'cart' ? 'Carrinho' : step === 'delivery' ? 'Entrega' : step === 'payment' ? 'Pagamento' : 'Revisão'}`);
    };

    /**
     * Calculates the subtotal, discount, and total for the cart.
     * @returns {{subtotal: number, discountAmount: number, total: number}} The calculated totals.
     */
    const calculateTotal = () => {
        let subtotal = 0;
        state.cart.forEach((item) => {
            const product = state.products.find((p) => p.id === item.id);
            if (product) subtotal += product.price * item.quantity;
        });
        const discountAmount = state.appliedPromo && state.validPromoCodes[state.appliedPromo]
            ? isNaN(state.validPromoCodes[state.appliedPromo])
                ? subtotal * state.validPromoCodes[state.appliedPromo]
                : state.validPromoCodes[state.appliedPromo]
            : 0;
        return { subtotal, discountAmount, total: subtotal - discountAmount };
    };

    /**
     * Renders the cart items and summary.
     * @returns {boolean} True if the cart has items, false otherwise.
     */
    const renderCart = () => {
        if (!dom.cartItemsEl || !dom.summaryItemsEl) return false;
        if (state.cart.length === 0) {
            dom.cartItemsEl.innerHTML = '<p>Seu carrinho está vazio. <a href="index.html">Explore agora!</a></p>';
            dom.summaryItemsEl.innerHTML = '<p>Sem itens.</p>';
            [dom.cartTotalEl, dom.summaryDiscountEl, dom.summaryTotalEl, dom.orderDiscountEl, dom.orderTotalEl].forEach(el => {
                if (el) el.textContent = 'Kz 0';
            });
            if (dom.orderItemCountEl) dom.orderItemCountEl.textContent = '0';
            speak('Seu carrinho está vazio.');
            return false;
        }

        const { subtotal, discountAmount, total } = calculateTotal();
        dom.cartItemsEl.innerHTML = state.cart.map((item) => {
            const product = state.products.find((p) => p.id === item.id);
            if (!product) return '';
            return `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${product.images?.[0] || product.image}" alt="${product.name}" loading="lazy">
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
        }).join('');

        dom.summaryItemsEl.innerHTML = state.cart.map((item) => {
            const product = state.products.find((p) => p.id === item.id);
            if (!product) return '';
            return `<div class="summary-item"><span>${product.name} x${item.quantity}</span><span>Kz ${(product.price * item.quantity).toLocaleString('pt-AO')}</span></div>`;
        }).join('');

        if (dom.cartTotalEl) dom.cartTotalEl.textContent = `Kz ${total.toLocaleString('pt-AO')}`;
        if (dom.summaryDiscountEl) dom.summaryDiscountEl.textContent = `Kz ${discountAmount.toLocaleString('pt-AO')}`;
        if (dom.summaryTotalEl) dom.summaryTotalEl.textContent = `Kz ${total.toLocaleString('pt-AO')}`;
        if (dom.orderItemCountEl) dom.orderItemCountEl.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
        if (dom.orderDiscountEl) dom.orderDiscountEl.textContent = `Kz ${discountAmount.toLocaleString('pt-AO')}`;
        if (dom.orderTotalEl) dom.orderTotalEl.textContent = `Kz ${total.toLocaleString('pt-AO')}`;
        try{
        lucide.createIcons();
        gsap.from('.cart-item', { x: 50, opacity: 0, stagger: 0.1, duration: 0.5 });
        }catch(e){
            console.error("erro ao carregar ",e);
          }
        return true;
    };

    /**
     * Clears all items from the cart.
     */
    const clearCart = () => {
        if (confirm('Tem certeza que deseja remover todos os itens do carrinho?')) {
            state.cart = [];
            localStorage.setItem('cartItems', JSON.stringify(state.cart));
            renderCart();
            showToast('Carrinho limpo!', 'info');
        }
    };

    /**
     * Validates a name.
     * @param {string} name - The name to validate.
     * @returns {string} An error message if invalid, otherwise an empty string.
     */
    const validateName = (name) => name.trim().length >= 2 ? '' : 'Nome deve ter pelo menos 2 caracteres';

    /**
     * Validates a phone number.
     * @param {string} phone - The phone number to validate.
     * @returns {string} An error message if invalid, otherwise an empty string.
     */
    const validatePhone = (phone) => /^\+?\d{9,}$/.test(phone.replace(/\s/g, '')) ? '' : 'Telefone inválido (ex.: +244 923 456 789)';

    /**
     * Validates an address.
     * @param {string} address - The address to validate.
     * @returns {string} An error message if invalid, otherwise an empty string.
     */
    const validateAddress = (address) => address.trim().length >= 10 ? '' : 'Endereço deve ter pelo menos 10 caracteres';

    /**
     * Estimates the delivery time based on the address.
     * @param {string} address - The delivery address.
     */
    const estimateDelivery = debounce((address) => {
        if (!dom.deliveryEstimateEl) return;
        const isLuanda = address.toLowerCase().includes('luanda');
        const days = isLuanda ? '2-3 dias úteis' : '5-7 dias úteis';
        dom.deliveryEstimateEl.textContent = `Entrega estimada em ${days}`;
        speak(`Entrega estimada em ${days}`);
    }, 500);

    /**
     * Loads saved delivery details from localStorage.
     */
    const loadDeliveryDetails = () => {
        const saved = JSON.parse(localStorage.getItem('deliveryDetails')) || {};
        const elements = ['fullName', 'phone', 'address', 'deliveryNotes'].map(id => document.getElementById(id));
        if (elements[0]) elements[0].value = saved.fullName || '';
        if (elements[1]) elements[1].value = saved.phone || '';
        if (elements[2]) elements[2].value = saved.address || '';
        if (elements[3]) elements[3].value = saved.notes || '';
        if (saved.address) estimateDelivery(saved.address);
    };

    /**
     * Applies a color theme to the page.
     * @param {'light' | 'dark'} theme - The theme to apply.
     */
    const applyTheme = (theme) => {
        document.body.classList.toggle('dark-theme', theme === 'dark');
        const sunIcon = document.querySelector('#themeToggle [data-lucide="sun"]');
        const moonIcon = document.querySelector('#themeToggle [data-lucide="moon"]');
        if (sunIcon && moonIcon) {
            sunIcon.style.display = theme === 'dark' ? 'none' : 'block';
            moonIcon.style.display = theme === 'dark' ? 'block' : 'none';
        }
    };

    // --- Event Listeners ---
    // Carrinho
    if (dom.cartItemsEl) {
        dom.cartItemsEl.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            const id = parseInt(target.dataset.id);
            const item = state.cart.find((i) => i.id === id);
            if (target.classList.contains('remove-item')) {
                state.cart = state.cart.filter((i) => i.id !== id);
                showToast('Item removido', 'info');
            } else if (target.dataset.action === 'increase') {
                item.quantity += 1;
                showToast('Quantidade aumentada', 'info');
            } else if (target.dataset.action === 'decrease') {
                if (item.quantity > 1) {
                    item.quantity -= 1;
                    showToast('Quantidade diminuída', 'info');
                } else {
                    state.cart = state.cart.filter((i) => i.id !== id);
                    showToast('Item removido', 'info');
                }
            }
            localStorage.setItem('cartItems', JSON.stringify(state.cart));
            renderCart();
        });
    }

    // Limpar Carrinho (Novo)
    if (dom.clearCartBtn) {
        dom.clearCartBtn.addEventListener('click', clearCart);
    }

    // Promo Code
    if (dom.applyPromoBtn && dom.promoCodeInput && dom.promoCodeError) {
        dom.applyPromoBtn.addEventListener('click', () => {
            const code = dom.promoCodeInput.value.trim().toUpperCase();
            if (state.validPromoCodes[code]) {
                state.appliedPromo = code;
                dom.promoCodeError.textContent = 'Código aplicado!';
                dom.promoCodeError.style.color = 'var(--success-color)';
                showToast('Código aplicado!', 'success');
                renderCart();
            } else {
                state.appliedPromo = '';
                dom.promoCodeError.textContent = 'Código inválido.';
                dom.promoCodeError.style.color = 'var(--error-color)';
                showToast('Código inválido', 'error');
            }
        });
    }

    // Entrega
    if (dom.proceedToDeliveryBtn) {
        dom.proceedToDeliveryBtn.addEventListener('click', () => {
            if (renderCart()) updateProgress('delivery');
            else showToast('Adicione itens ao carrinho', 'error');
        });
    }

    if (dom.deliveryForm) {
        dom.deliveryForm.addEventListener('submit', (e) => {
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

            ['fullNameError', 'phoneError', 'addressError'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = errors[id.replace('Error', '').toLowerCase()];
            });

            if (Object.values(errors).every(err => !err)) {
                localStorage.setItem('deliveryDetails', JSON.stringify({ fullName, phone, address, notes }));
                if (dom.orderDeliveryEl) dom.orderDeliveryEl.textContent = `${fullName}, ${address}${notes ? ` (${notes})` : ''}`;
                updateProgress('payment');
                showToast('Detalhes salvos!', 'success');
            } else {
                showToast('Corrija os erros', 'error');
            }
        });
    }

    // Pagamento
    if (dom.paymentMethods && dom.paymentDetails) {
        dom.paymentMethods.forEach((method) => {
            method.addEventListener('change', () => {
                const value = method.value;
                if (dom.orderPaymentEl) {
                    dom.orderPaymentEl.textContent = value === 'mpesa' ? 'M-Pesa' : value === 'card' ? 'Cartão' : 'Pagamento na Entrega';
                }
                dom.paymentDetails.innerHTML = value === 'mpesa' ? `
                    <div class="form-group">
                        <p>Envie para <strong>+244 197 411 197</strong> e insira o código:</p>
                        <label for="mpesaCode">Código</label>
                        <div class="input-wrapper">
                            <i data-lucide="smartphone"></i>
                            <input type="text" id="mpesaCode" placeholder="Ex.: 9876543210" required aria-label="Código M-Pesa">
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
                            <input type="text" id="cardExpiry" placeholder="MM/AA" required aria-label="Validade">
                            <span class="error-message" id="cardExpiryError"></span>
                        </div>
                        <div class="form-group">
                            <label for="cardCVC">CVC</label>
                            <input type="text" id="cardCVC" placeholder="123" required aria-label="CVC">
                            <span class="error-message" id="cardCVCError"></span>
                        </div>
                    </div>
                ` : `<p>Pague ao receber os produtos.</p>`;
                try{
                lucide.createIcons();
                gsap.from(dom.paymentDetails, { opacity: 0, y: 20, duration: 0.5 });

                }catch(e){
            console.error("erro ao carregar ",e);
          }
                });
        });
    }

    // Salvar Pagamento
    if (dom.savePaymentBtn) {
        dom.savePaymentBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked');
            if (!selectedMethod) {
                showToast('Selecione um método', 'error');
                return;
            }
            const paymentMethod = selectedMethod.value;
            let isValid = true;

            if (paymentMethod === 'mpesa') {
                const mpesaCode = document.getElementById('mpesaCode')?.value.trim();
                const error = mpesaCode && mpesaCode.length >= 8 ? '' : 'Código inválido';
                const mpesaCodeError = document.getElementById('mpesaCodeError');
                if (mpesaCodeError) mpesaCodeError.textContent = error;
                isValid = !error;
            } else if (paymentMethod === 'card') {
                const cardNumber = document.getElementById('cardNumber')?.value.replace(/\s/g, '');
                const cardExpiry = document.getElementById('cardExpiry')?.value.trim();
                const cardCVC = document.getElementById('cardCVC')?.value.trim();
                const errors = {
                    cardNumber: cardNumber && cardNumber.length === 16 && /^\d+$/.test(cardNumber) ? '' : 'Número inválido',
                    cardExpiry: cardExpiry && /^\d{2}\/\d{2}$/.test(cardExpiry) ? '' : 'Validade inválida (MM/AA)',
                    cardCVC: cardCVC && cardCVC.length === 3 && /^\d{3}$/.test(cardCVC) ? '' : 'CVC inválido',
                };
                ['cardNumberError', 'cardExpiryError', 'cardCVCError'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = errors[id.replace('Error', '').toLowerCase()];
                });
                isValid = Object.values(errors).every(err => !err);
            }

            if (isValid) {
                updateProgress('review');
                showToast('Pagamento salvo!', 'success');
            } else {
                showToast('Corrija os erros', 'error');
            }
        });
    }

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
        if (!deliveryDetails.fullName) {
            showToast('Preencha entrega', 'error');
            updateProgress('delivery');
            return;
        }
        if (!paymentMethod) {
            showToast('Selecione pagamento', 'error');
            updateProgress('payment');
            return;
        }
        if (dom.confirmationModal) {
            dom.confirmationModal.classList.add('visible');
            dom.confirmationModal.setAttribute('aria-hidden', 'false');
            try{
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#FF6B6B', '#4ECDC4', '#FFE66D'] });
            }catch(e){
            console.error("erro ao carregar ",e);
          }
            showToast('Pedido confirmado!', 'success');
            speak('Seu pedido foi confirmado! Obrigado.');
            localStorage.removeItem('cartItems');
            localStorage.removeItem('deliveryDetails');
            state.appliedPromo = '';
        }
    };

    [dom.placeOrderBtn, dom.placeOrderStickyBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', placeOrder);
    });

    // Tema e Voz
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
            showToast(`Tema ${newTheme}`, 'info');
        });
        applyTheme(localStorage.getItem('theme') || 'light');
    }

    if (dom.voiceToggleBtn) {
        dom.voiceToggleBtn.addEventListener('click', () => {
            state.isVoiceEnabled = !state.isVoiceEnabled;
            localStorage.setItem('voiceEnabled', state.isVoiceEnabled);
            const icon = dom.voiceToggleBtn.querySelector('i');
            if (icon) icon.setAttribute('data-lucide', state.isVoiceEnabled ? 'mic-off' : 'mic');
            try {
        lucide.createIcons();
    } catch (e) {
        console.error('Erro ao carregar ícones Lucide:', e);
    }
            showToast(`Voz ${state.isVoiceEnabled ? 'desativada' : 'ativada'}`, 'info');
            speak(state.isVoiceEnabled ? 'Assistente de voz ativado.' : 'Assistente de voz desativado.');
        });
        dom.voiceToggleBtn.setAttribute('aria-checked', state.isVoiceEnabled);
        const icon = dom.voiceToggleBtn.querySelector('i');
        if (icon) icon.setAttribute('data-lucide', state.isVoiceEnabled ? 'mic-off' : 'mic');
        try {
        lucide.createIcons();
    } catch (e) {
        console.error('Erro ao carregar ícones Lucide:', e);
    }
    }

    // Modal Fechar
    if (dom.modalCloseBtn && dom.confirmationModal) {
        dom.modalCloseBtn.addEventListener('click', () => {
            dom.confirmationModal.classList.remove('visible');
            dom.confirmationModal.setAttribute('aria-hidden', 'true');
            try{
            gsap.to(dom.confirmationModal, {
                scale: 0.8,
                opacity: 0,
                duration: 0.3,
                onComplete: () => window.location.href = 'index.html',
            });
            }catch(e){
            console.error("erro ao carregar ",e);
          }
        });
    }

    // Endereço Input
    const addressInput = document.getElementById('address');
    if (addressInput) addressInput.addEventListener('input', (e) => estimateDelivery(e.target.value));

    // --- Inicialização ---
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        showToast('Faça login', 'error');
        setTimeout(() => window.location.href = '/auth/login.html', 1500);
        return;
    }

    await loadData();
    loadDeliveryDetails();
    renderCart();
    updateProgress('cart');
    speak('Bem-vindo à finalização de compra!');
});
