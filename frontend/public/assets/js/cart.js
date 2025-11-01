document.addEventListener("DOMContentLoaded", () => {
    const cartItemsContainer = document.querySelector(".cart-items");
    const subtotalElement = document.querySelector(".summary-row:nth-child(1) span:nth-child(2)");
    const totalElement = document.querySelector(".summary-total span:nth-child(2)");

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    function renderCart() {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = "";
        let subtotal = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = "<p>O seu carrinho está vazio.</p>";
            if (subtotalElement) subtotalElement.textContent = "AOA 0.00";
            if (totalElement) totalElement.textContent = "AOA 0.00";
            return;
        }

        cart.forEach(item => {
            const cartItem = document.createElement("div");
            cartItem.className = "cart-item";
            cartItem.innerHTML = `
                <img src="${item.image_url || 'https://via.placeholder.com/100'}" alt="${item.name}" class="item-image">
                <div class="item-details">
                    <p class="item-name">${item.name}</p>
                    <p class="item-price">AOA ${parseFloat(item.price).toLocaleString("pt-AO")}</p>
                </div>
                <div class="item-quantity">
                    <button data-id="${item.id}" class="quantity-decrease">-</button>
                    <input type="text" value="${item.quantity}" readonly>
                    <button data-id="${item.id}" class="quantity-increase">+</button>
                </div>
                <p class="item-total">AOA ${(parseFloat(item.price) * item.quantity).toLocaleString("pt-AO")}</p>
                <button data-id="${item.id}" class="item-remove"><i class="fas fa-trash"></i></button>
            `;
            cartItemsContainer.appendChild(cartItem);
            subtotal += parseFloat(item.price) * item.quantity;
        });

        if (subtotalElement) subtotalElement.textContent = `AOA ${subtotal.toLocaleString("pt-AO")}`;
        // Assuming a fixed shipping for now
        const shipping = 2000;
        if (totalElement) totalElement.textContent = `AOA ${(subtotal + shipping).toLocaleString("pt-AO")}`;
    }

    cartItemsContainer.addEventListener("click", (e) => {
        const target = e.target;
        const productId = target.closest("button")?.dataset.id;
        if (!productId) return;

        if (target.closest(".quantity-increase")) {
            const item = cart.find(i => i.id == productId);
            if (item) item.quantity++;
        }

        if (target.closest(".quantity-decrease")) {
            const item = cart.find(i => i.id == productId);
            if (item && item.quantity > 1) {
                item.quantity--;
            } else {
                cart = cart.filter(i => i.id != productId);
            }
        }

        if (target.closest(".item-remove")) {
            cart = cart.filter(i => i.id != productId);
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        renderCart();
    });

    renderCart();
});
