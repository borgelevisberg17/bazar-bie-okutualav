import { showToast } from './notifications.js';

document.addEventListener('DOMContentLoaded', () => {
    const cartItemsEl = document.getElementById('cartItems');
    const summaryTotalEl = document.getElementById('summaryTotal');
    const checkoutNextBtn = document.getElementById('checkout-next-btn');
    const placeOrderBtn = document.getElementById('place-order-btn');
    const deliveryForm = document.getElementById('deliveryForm');
    const paymentOptionsEl = document.querySelector('.payment-options');

    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    const renderCart = () => {
        if (cart.length === 0) {
            cartItemsEl.innerHTML = '<p>O seu carrinho está vazio.</p>';
            return;
        }

        let total = 0;
        cartItemsEl.innerHTML = cart.map(item => {
            const price = parseFloat(item.price.replace(/[^0-9,-]+/g,"").replace(",", "."));
            total += price * item.quantity;
            return `
                <div class="cart-item" data-id="${item.id}">
                    <span>${item.name} (x${item.quantity})</span>
                    <span>${(price * item.quantity).toLocaleString("pt-AO", { style: 'currency', currency: 'AOA' })}</span>
                </div>
            `;
        }).join('');
        summaryTotalEl.textContent = total.toLocaleString("pt-AO", { style: 'currency', currency: 'AOA' });
    };

    const renderDeliveryForm = () => {
        deliveryForm.innerHTML = `
            <div class="form-group span-2">
                <label for="fullName" class="form-label">Nome Completo</label>
                <input type="text" class="form-control" id="fullName" placeholder="Seu nome completo" required>
            </div>
            <div class="form-group span-2">
                <label for="phone" class="form-label">Telefone</label>
                <input type="tel" class="form-control" id="phone" placeholder="+244 9XX XXX XXX" required>
            </div>
            <div class="form-group span-2">
                <label for="address" class="form-label">Endereço de Entrega</label>
                <input type="text" class="form-control" id="address" placeholder="Sua rua, bairro, cidade" required>
            </div>
        `;
    };

    const renderPaymentOptions = () => {
        paymentOptionsEl.innerHTML = `
            <label class="payment-option">
                <input type="radio" name="paymentMethod" value="mpesa" checked>
                <span>M-Pesa</span>
            </label>
            <label class="payment-option">
                <input type="radio" name="paymentMethod" value="card">
                <span>Cartão de Crédito/Débito</span>
            </label>
             <label class="payment-option">
                <input type="radio" name="paymentMethod" value="cash">
                <span>Pagamento na Entrega</span>
            </label>
        `;
    };

    const renderReview = () => {
        const reviewDetails = document.querySelector('.review-details');
        const deliveryDetails = JSON.parse(localStorage.getItem('deliveryDetails')) || {};
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'N/A';

        reviewDetails.innerHTML = `
            <div class="review-section">
                <h3>Itens do Pedido:</h3>
                ${cart.map(item => `<div>${item.name} (x${item.quantity})</div>`).join('')}
            </div>
            <div class="review-section">
                <h3>Detalhes da Entrega:</h3>
                <p>${deliveryDetails.fullName}, ${deliveryDetails.address}</p>
            </div>
            <div class="review-section">
                <h3>Método de Pagamento:</h3>
                <p>${paymentMethod}</p>
            </div>
        `;
    };

    const handleCheckoutStep = (step) => {
        document.querySelectorAll('.checkout-step-content').forEach(el => el.classList.remove('active'));
        document.querySelector(`.checkout-step-content[data-step="${step}"]`).classList.add('active');
        if (step === 4) { // Review step
            renderReview();
            checkoutNextBtn.style.display = 'none';
            placeOrderBtn.style.display = 'block';
        }
    };

    checkoutNextBtn.addEventListener('click', () => {
        const currentStepEl = document.querySelector('.checkout-step-content.active');
        const currentStep = parseInt(currentStepEl.dataset.step);

        if (currentStep === 1) {
            renderDeliveryForm();
        }

        if (currentStep === 2) {
            if (!deliveryForm.checkValidity()) {
                deliveryForm.reportValidity();
                return;
            }
            const deliveryDetails = {
                fullName: document.getElementById('fullName').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value
            };
            localStorage.setItem('deliveryDetails', JSON.stringify(deliveryDetails));
            renderPaymentOptions();
        }

        if (currentStep === 3) {
            renderReview();
        }

        handleCheckoutStep(currentStep + 1);
    });

    placeOrderBtn.addEventListener('click', () => {
        localStorage.removeItem('cart');
        localStorage.removeItem('deliveryDetails');
        showToast('Compra finalizada com sucesso!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    });

    renderCart();
});
