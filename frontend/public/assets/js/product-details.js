import { getProducts, api } from "./services/api.js";

document.addEventListener("DOMContentLoaded", async () => {
    const mainImage = document.getElementById("main-product-image");
    const thumbnailContainer = document.querySelector(".thumbnail-images");
    const productTitle = document.querySelector(".product-title-details");
    const productPrice = document.querySelector(".product-price-details");
    const productDescription = document.querySelector(".product-description-details");
    const quantityInput = document.querySelector(".quantity-input");
    const quantityButtons = document.querySelectorAll(".btn-quantity");
    const addToCartButton = document.querySelector(".btn-add-to-cart");
    const wishlistButton = document.querySelector(".btn-wishlist-details");

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get("id");

    if (!productId) {
        // Handle error: product ID not found
        return;
    }

    try {
        const productData = await getProducts(productId);
        const product = productData.data;

        if (product) {
            updateProductDetails(product);
        } else {
            // Handle error: product not found
        }
    } catch (error) {
        console.error("Error fetching product:", error);
    }

    function updateProductDetails(product) {
        mainImage.src = product.images[0];
        productTitle.textContent = product.name;
        productPrice.textContent = `${parseFloat(product.price).toLocaleString("pt-AO")} Kz`;
        productDescription.textContent = product.description;

        thumbnailContainer.innerHTML = product.images.map((img, index) => `
            <img src="${img}" alt="Thumbnail ${index + 1}" class="${index === 0 ? 'active' : ''}">
        `).join('');
    }

    thumbnailContainer.addEventListener("click", e => {
        if (e.target.tagName === "IMG") {
            mainImage.src = e.target.src;
            document.querySelectorAll(".thumbnail-images img").forEach(img => img.classList.remove("active"));
            e.target.classList.add("active");
        }
    });

    quantityButtons.forEach(button => {
        button.addEventListener("click", () => {
            const action = button.dataset.action;
            let quantity = parseInt(quantityInput.value);
            if (action === "increase") {
                quantity++;
            } else if (action === "decrease" && quantity > 1) {
                quantity--;
            }
            quantityInput.value = quantity;
        });
    });

    addToCartButton.addEventListener("click", () => {
        const quantity = parseInt(quantityInput.value);
        showToast(`Adicionado ${quantity} item(s) ao carrinho!`);
    });

    wishlistButton.addEventListener("click", async () => {
        try {
            await api.post("/wishlist", { productId });
            showToast("Produto adicionado aos favoritos!");
        } catch (error) {
            showToast("Erro ao adicionar aos favoritos.", "error");
        }
    });
});
