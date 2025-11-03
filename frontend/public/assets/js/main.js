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
            const imageUrl = product.images && product.images.length > 0 ? product.images[0].image_url : 'assets/images/placeholders/product.png';

            productCard.innerHTML = `
                <div class="product-card-header">
                    <img src="${product.seller?.avatar_url || 'assets/images/placeholders/avatar.png'}" alt="${product.seller?.name}" class="seller-avatar">
                    <div class="seller-info">
                        <a href="seller.html?id=${product.seller?.id}" class="seller-name">${product.seller?.name}</a>
                        <span class="post-time">${new Date(product.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
                <a href="product.html?id=${product.id}" class="product-image-container">
                    <img src="${imageUrl}" alt="${product.name}" class="product-image">
                </a>
                <div class="product-info">
                    <a href="product.html?id=${product.id}" class="product-title">${product.name}</a>
                    <p class="product-description">${product.description ? product.description.substring(0, 100) + '...' : ''}</p>
                    <p class="product-price">${parseFloat(product.price).toLocaleString("pt-AO", { style: 'currency', currency: 'AOA' })}</p>
                </div>
                <div class="product-card-footer">
                    <div class="product-actions">
                        <button class="product-action-btn" data-action="like"><i class="far fa-heart"></i> <span>${product.likes_count || 0}</span></button>
                        <button class="product-action-btn" data-action="comment"><i class="far fa-comment"></i> <span>${product.comments_count || 0}</span></button>
                    </div>
                    <button class="btn btn-primary btn-add-to-cart" data-product-id="${product.id}">Adicionar</button>
                </div>`;
            container.appendChild(productCard);
        });
    }

    productsGrid.addEventListener('click', async (e) => {
        const target = e.target;
        const productCard = target.closest('.product-card');
        if (!productCard) return;

        const productId = productCard.querySelector('.btn-add-to-cart').dataset.productId;

        if (target.closest('.btn-add-to-cart')) {
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

        if (target.closest('.product-action-btn[data-action="like"]')) {
            try {
                const response = await api.post(`/products/${productId}/like`);
                if (response.data) {
                    const likeCount = target.closest('.product-action-btn').querySelector('span');
                    likeCount.textContent = parseInt(likeCount.textContent) + 1;
                    showToast('Gostou do produto!', 'success');
                }
            } catch (error) {
                showToast('Erro ao gostar do produto.', 'error');
            }
        }

        if (target.closest('.product-action-btn[data-action="comment"]')) {
            window.location.href = `product.html?id=${productId}#comments-section`;
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
