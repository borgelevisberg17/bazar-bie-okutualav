import { getProduct } from './services/api.js';

document.addEventListener("DOMContentLoaded", async () => {
    const productName = document.getElementById("product-name");
    const productPrice = document.getElementById("product-price");
    const productDescription = document.getElementById("product-description");
    const mainProductImage = document.getElementById("main-product-image");

    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (productId) {
        try {
            const productData = await getProduct(productId);
            const product = productData.data;

            if (product) {
                productName.textContent = product.name;
                productPrice.textContent = `${parseFloat(product.price).toLocaleString("pt-AO")} AOA`;
                productDescription.textContent = product.description;
                mainProductImage.src = product.image_url || 'https://via.placeholder.com/500';
            } else {
                // Handle product not found
            }
        } catch (error) {
            console.error("Failed to load product details:", error);
        }
    }
});
