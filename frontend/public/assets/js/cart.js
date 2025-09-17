document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.querySelector('.cart-items');
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
     const totalEl = document.getElementById('total');

let cart = JSON.parse(localStorage.getItem('cartItems')) || [];
let products = [];
    async function loadCartProducts() {
        if (cart.length === 0) {
            renderCart();
            return;
        }

        const productIds = cart.map(item => item.id);
        const promises = productIds.map(id => fetch(`${API_URL}/products/${id}`).then(res => res.json()));
        const results = await Promise.all(promises);
        products = results.map(res => res.data);
        renderCart();
    }

    function formatAOA(n) {
        return `AOA ${n.toLocaleString("pt-AO")}`;
    }

    function renderCart() {
        if (cartItemsContainer) {
            if (cart.length === 0) {
                cartItemsContainer.innerHTML = '<p>O seu carrinho está vazio.</p>';
            } else {
                cartItemsContainer.innerHTML = cart.map(item => {
                    const product = products.find(p => p.id === item.id);
                    if (!product) return '';
                    const imageUrl = product.images && product.images.length > 0 ? product.images[0].url : 'assets/images/placeholders/product.png';
                    return `
                        <div class="cart-item">
                            <img src="${imageUrl}" alt="${product.name}" class="item-image">
                            <div class="item-details">
                                <h3>${product.name}</h3>
                                <p>${formatAOA(product.price)}</p>
                            </div>
                            <div class="item-quantity">
                                <input type="number" value="${item.quantity}" min="1" data-id="${item.id}">
                            </div>
                            <div class="item-total">
                                ${formatAOA(product.price * item.quantity)}
                            </div>
                            <button class="btn-remove" data-id="${item.id}">Remover</button>
                        </div>
                    `;
                }).join('');
            }
        }
        updateSummary();
    }

    function updateSummary() {
        const subtotal = cart.reduce((acc, item) => {
            const product = products.find(p => p.id === item.id);
            return acc + (product ? product.price * item.quantity : 0);
        }, 0);
        const shipping = 500; // Mock shipping fee
        const total = subtotal + shipping;

        if (subtotalEl) subtotalEl.textContent = formatAOA(subtotal);
        if (shippingEl) shippingEl.textContent = formatAOA(shipping);
        if (totalEl) totalEl.textContent = formatAOA(total);
    }

    cartItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove')) {
            const productId = e.target.dataset.id;
            cart = cart.filter(item => item.id != productId);
            localStorage.setItem('cartItems', JSON.stringify(cart));
            loadCartProducts();
        }
    });

    cartItemsContainer.addEventListener('change', (e) => {
        if (e.target.type === 'number') {
            const productId = e.target.dataset.id;
            const quantity = parseInt(e.target.value);
            const item = cart.find(item => item.id == productId);
            if (item) {
                item.quantity = quantity;
                localStorage.setItem('cartItems', JSON.stringify(cart));
                renderCart();
            }
        }
    });

    loadCartProducts();

    const checkoutBtn = document.querySelector('.btn-checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            window.location.href = 'checkout.html';
        });
    }
});
