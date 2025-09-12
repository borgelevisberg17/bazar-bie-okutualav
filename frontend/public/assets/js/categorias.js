document.addEventListener("DOMContentLoaded", async () => {
    try {
        lucide.createIcons();

        AOS.init({ duration: 800, once: true, offset: 50 });
    } catch (e) {
        console.error("erro ao carregar: ", e);
    }
    const response = await fetch("../database/data.json");
    const data = await response.json();
    const categories = data.categories;

    const allProducts = Array.from({ length: 79 }, (_, i) => ({
        id: i + 1,
        name: `Descrição do produto #${i + 1}`,
        price: Math.floor(Math.random() * 99000) + 1000,
        discount: Math.floor(Math.random()) + 30,
        vendidos: Math.floor(Math.random() * 3000) + 10,
        image: `../assets/produto–${i + 1}.jpg`,
        category:
            categories[Math.floor(Math.random() * (categories.length - 1)) + 1]
                .slug,
        reviews: Math.floor(Math.random() * 100) + 10,
        rating: Math.floor(Math.random(1, 9)),
        isNew: Math.random() > 0.8
    }));

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
        card.innerHTML = `
            <div class="media">
              <img src="${p.image}" alt="${p.name}" loading="lazy">
              ${p.isNew ? '<span class="badge">Novo</span>' : ""}
              <div class="option-card">
              <button class="fav-btn" aria-label="Adicionar aos favoritos" title="Favoritar"><i data-lucide="heart"></i></button>

               </div>
                ${
                    p.discount
                        ? `<span class="discount-badge">-${p.discount}%</span>`
                        : ""
                }
            </div>
            <div class="meta">

              <div class="price-action">
                <span class="price">${
                    formatAOA(p.discount)
                        ? `<span class="old-price">${formatAOA(p.price)}</span> 
                       <span class="new-price"> ${formatAOA(
                           p.price - (p.price * p.discount) / 100
                       )}</span>`
                        : `${formatAOA(p.price)}`
                }
                </span>
              </div>
        <div class="p-info">
        <p class="total-vendidos">${p.vendidos} + vendidos</p>
        <div class="product-rating">
                ${"★".repeat(p.rating || 1)}${"☆".repeat(1 - (p.rating || 1))}
                <span class="rating-count">(${p.reviews || 12})</span>
            </div></div>
           <h3 class="title">${p.name}</h3>
            </div>
          `;
        return card;
    }

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

    function loadProducts() {
        if (state.isLoading) return;
        state.isLoading = true;
        loader.innerHTML = `<div class="spinner"></div>`;

        setTimeout(() => {
            const filteredProducts =
                state.filter === "all"
                    ? allProducts
                    : allProducts.filter(p => p.category === state.filter);

            const start = (state.page - 1) * state.perPage;
            const end = start + state.perPage;
            const slice = filteredProducts.slice(start, end);

            state.isLoading = false;
            loader.innerHTML = "";

            if (slice.length) {
                slice.forEach(p => productsGrid.appendChild(productCard(p)));
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
        }, 600);
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
