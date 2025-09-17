document.addEventListener("DOMContentLoaded", async () => {
    try {
        lucide.createIcons();

        AOS.init({ duration: 800, once: true, offset: 50 });
    } catch (e) {
        console.error("erro ao carregar: ", e);
    }

        let categories = [];
    let allProducts = [];

    async function fetchData(endpoint) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Could not fetch data from ${endpoint}:`, error);
            throw error;
        }
    }

    const categoriesData = await fetchData("/categories");
    categories = categoriesData?.data || [];

    const productsGrid = document.getElementById("productsGrid");
    const loader = document.getElementById("loader");
    const categoryShelf = document.getElementById("categoryShelf");
    const feedTitle = document.getElementById("feedTitle");

    let state = { page: 1, perPage: 12, isLoading: false, filter: "all" };

    function formatAOA(n) {
        return `AOA${n.toLocaleString("pt-AO")}Kz`;
    }

    function productCard(p) {
        const card = document.createElement("article");
        card.className = "card";
        card.setAttribute("data-aos", "fade-up");
        const imageUrl = p.images && p.images.length > 0 ? p.images[0].url : 'assets/images/placeholders/product.png';
        const rating = Math.round(p.rating || 0);
        card.innerHTML = `
            <div class="media">
              <img src="${imageUrl}" alt="${p.name}" loading="lazy">
              <div class="option-card">
              <button class="fav-btn" aria-label="Adicionar aos favoritos" title="Favoritar"><i data-lucide="heart"></i></button>
               </div>
            </div>
            <div class="meta">
              <div class="price-action">
                <span class="price">${formatAOA(p.price)}</span>
              </div>
              <div class="p-info">
                <div class="product-rating">
                ${"★".repeat(rating)}${"☆".repeat(5 - rating)}
                <span class="rating-count">(${p.reviews_count || 0})</span>
                    </div></div>
              <h3 class="title">${p.name}</h3>
            </div>
            <button class="btn-add-to-cart" data-id="${p.id}"><i data-lucide="shopping-cart"></i></button>
          `;
        return card;
    }

    productsGrid.addEventListener('click', (e) => {
        if (e.target.closest('.btn-add-to-cart')) {
            const button = e.target.closest('.btn-add-to-cart');
            const productId = button.dataset.id;
            let cart = JSON.parse(localStorage.getItem('cartItems')) || [];
            const item = cart.find(item => item.id == productId);
            if (item) {
                item.quantity++;
            } else {
                cart.push({ id: productId, quantity: 1 });
            }
            localStorage.setItem('cartItems', JSON.stringify(cart));
            // You can add a visual feedback here, like a toast notification
        }
    });

    function renderCategories() {
        categoryShelf.innerHTML = categories
            .map(
                c => `
                <button class="category-chip" data-cat="${c.slug}">
                    <i data-lucide="${c.icon}"></i>
                    <span>${c.name}</span>
                </button>
            `
            )
            .join("");
        try {
            lucide.createIcons();
        } catch (e) {
            console.error("erro: ", e);
        }
        document
            .querySelector('.category-chip[data-cat="all"]')
            .classList.add("active");
    }

    function handleCategoryFilter(e) {
        const chip = e.target.closest(".category-chip");
        if (!chip) return;

        document
            .querySelectorAll(".category-chip")
            .forEach(c => c.classList.remove("active"));
        chip.classList.add("active");

        state.filter = chip.dataset.cat;
        const categoryName = categories.find(c => c.slug === state.filter).name;
        feedTitle.textContent =
            categoryName === "Tudo" ? "Para Si" : categoryName;

        productsGrid.innerHTML = "";
        state.page = 1;
        loadProducts();
    }

    async function loadProducts() {
        if (state.isLoading) return;
        state.isLoading = true;
        loader.innerHTML = `<div class="spinner"></div>`;

        try {
            let endpoint = `/products?page=${state.page}&limit=${state.perPage}`;
            if (state.filter !== "all") {
                endpoint += `&category=${state.filter}`;
            }
            const productsData = await fetchData(endpoint);
            const products = productsData.data || [];

            if (products.length) {
                products.forEach(p => productsGrid.appendChild(productCard(p)));
                state.page++;
                try {
                    lucide.createIcons();
                    AOS.refresh();
                } catch (e) {
                    console.error("erro: ", e);
                }
            } else {
                if (productsGrid.children.length === 0) {
                    loader.innerHTML =
                        '<p style="color:var(--muted)">Nenhum produto encontrado nesta categoria.</p>';
                }
            }
        } catch (error) {
            loader.innerHTML =
                '<p style="color:var(--muted)">Ocorreu um erro ao carregar os produtos.</p>';
        } finally {
            state.isLoading = false;
            loader.innerHTML = "";
        }
    }

    const io = new IntersectionObserver(
        entries => {
            if (entries[0].isIntersecting && !state.isLoading) {
                const filteredProducts =
                    state.filter === "all"
                        ? allProducts
                        : allProducts.filter(p => p.category === state.filter);
                if (productsGrid.children.length < filteredProducts.length) {
                    loadProducts();
                } else if (productsGrid.children.length > 0) {
                    loader.innerHTML =
                        '<p style="color:var(--muted)">Você chegou ao fim!</p>';
                }
            }
        },
        { rootMargin: "400px" }
    );
    function setupHeaderScroll() {
        const header = document.getElementById("mainHeader");
        window.addEventListener("scroll", () => {
            header.classList.toggle("scrolled", window.scrollY > 50);
        });
    }
    //menu
    const menuToggle = document.getElementById("menu-toggle");
    const sideMenu = document.getElementById("side-menu");
    const overlay = document.getElementById("mobile-overlay");

    function openMenu() {
        menuToggle.classList.add("is-active");
        sideMenu.classList.add("is-active");
        overlay.classList.add("is-active");
        document.body.classList.add("menu-open");
    }

    function closeMenu() {
        menuToggle.classList.remove("is-active");
        sideMenu.classList.remove("is-active");
        overlay.classList.remove("is-active");
        document.body.classList.remove("menu-open");
        // Fecha todos os submenus ao fechar o menu principal
        document.querySelectorAll(".has-submenu.is-open").forEach(submenu => {
            submenu.classList.remove("is-open");
            submenu.querySelector(".submenu").style.maxHeight = null;
        });
    }

    menuToggle.addEventListener("click", () => {
        if (sideMenu.classList.contains("is-active")) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    overlay.addEventListener("click", closeMenu);

    // Lógica para Submenus
    document.querySelectorAll(".has-submenu > a").forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            const parentLi = link.parentElement;
            const submenu = parentLi.querySelector(".submenu");

            if (parentLi.classList.contains("is-open")) {
                parentLi.classList.remove("is-open");
                submenu.style.maxHeight = null;
            } else {
                parentLi.classList.add("is-open");
                submenu.style.maxHeight = submenu.scrollHeight + "px";
            }
        });
    });
    categoryShelf.addEventListener("click", handleCategoryFilter);

    renderCategories();
    loadProducts();
    io.observe(loader);
});
