import { showToast } from "./notifications.js";
import { getProducts, getCategories } from "./services/api.js";

document.addEventListener("DOMContentLoaded", async () => {
    const productsGrid = document.getElementById("products-grid");
    const categoryFilters = document.getElementById("category-filters");
    const loadMoreBtn = document.getElementById("load-more-btn");

    let currentPage = 1;
    const productsPerPage = 12;

    const loadProducts = async (page, category = null) => {
        try {
            const productsData = await getProducts(page, productsPerPage, category);
            const products = productsData?.data || [];
            renderProducts(productsGrid, products, page > 1);
            if (products.length < productsPerPage) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'block';
            }
        } catch (error) {
            showToast("Erro ao carregar produtos.", "error");
        }
    };

    const loadCategories = async () => {
        try {
            const categoriesData = await getCategories();
            const categories = categoriesData?.data || [];
            renderCategories(categories);
        } catch (error) {
            showToast("Erro ao carregar categorias.", "error");
        }
    };

    function renderCategories(categories) {
        categoryFilters.innerHTML = `<button class="filter-btn active" data-category="all">Todos</button>`;
        categories.forEach(category => {
            categoryFilters.innerHTML += `<button class="filter-btn" data-category="${category.slug}">${category.name}</button>`;
        });

        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentPage = 1;
                productsGrid.innerHTML = '';
                const category = button.dataset.category === 'all' ? null : button.dataset.category;
                loadProducts(currentPage, category);
            });
        });
    }

    function renderProducts(container, products, append = false) {
        if (!append) container.innerHTML = "";
        if (products.length === 0 && !append) {
            container.innerHTML = "<p>Nenhum produto encontrado.</p>";
            return;
        }
        products.forEach(product => {
            const productCard = document.createElement("article");
            productCard.className = "product-card";
            productCard.innerHTML = `
                <a href="product.html?id=${product.id}" class="product-image-container">
                    <img src="${product.image_url || 'assets/images/placeholders/product.png'}" alt="${product.name}" class="product-image">
                </a>
                <div class="product-info">
                    <a href="product.html?id=${product.id}" class="product-title">${product.name}</a>
                    <p class="product-price">${parseFloat(product.price).toLocaleString("pt-AO", { style: 'currency', currency: 'AOA' })}</p>
                </div>
                <div class="product-card-footer">
                    <button class="btn btn-primary btn-add-to-cart" data-product-id="${product.id}">Adicionar</button>
                </div>`;
            container.appendChild(productCard);
        });
    }

    productsGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-add-to-cart')) {
            const productId = e.target.dataset.productId;
            const productCard = e.target.closest('.product-card');
            const productName = productCard.querySelector('.product-title').textContent;

            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            const existingProduct = cart.find(item => item.id === productId);

            if (existingProduct) {
                existingProduct.quantity += 1;
            } else {
                cart.push({ id: productId, name: productName, quantity: 1, price: productCard.querySelector('.product-price').textContent });
            }

            localStorage.setItem('cart', JSON.stringify(cart));
            showToast(`${productName} adicionado ao carrinho!`, 'success');
        }
    });

    loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        const currentCategory = categoryFilters.querySelector('.active').dataset.category;
        const category = currentCategory === 'all' ? null : currentCategory;
        loadProducts(currentPage, category);
    });

    loadProducts(currentPage);
    loadCategories();
});
