import { getCategories, getProducts, getSellers } from "./services/api.js";

document.addEventListener("DOMContentLoaded", async () => {
    const sellersGrid = document.getElementById("sellersGrid");
    const filtersContainer = document.getElementById("filters");
    const productsGrid = document.getElementById("products-grid");
    const recentArrived = document.getElementById("recently-arrived");
    const topFinds = document.getElementById("top-finds");
    const categoryShelf = document.getElementById("categorieList");
    const track = document.querySelector(".carousel-track");
    const dots = document.querySelectorAll(".dot");

    if (track && dots.length > 0) {
        track.addEventListener("scroll", () => {
            const index = Math.round(track.scrollLeft / track.offsetWidth);
            dots.forEach((dot, i) =>
                dot.classList.toggle("active", i === index)
            );
        });

        dots.forEach((dot, i) => {
            dot.addEventListener("click", () => {
                track.scrollTo({
                    left: i * track.offsetWidth,
                    behavior: "smooth"
                });
            });
        });
    }
    await loadPageData();
    async function loadPageData() {
        try {
            const [
                categoriesData,  productsData,
                sellersData
            ] = await Promise.all([
                getCategories(),
                 getProducts(),
                getSellers()
            ]);
            
            const categories = categoriesData?.data || [];
            const products = productsData?.data || [];
            const sellers = sellersData?.data || [];

            renderCategories(categories);
            renderFilters(categories);
            renderProducts(productsGrid, products);
            renderProducts(recentArrived, products.slice(0, 4));
            renderProducts(topFinds, products.slice(4, 8));
            renderSellers(sellers);
            setupFiltering();
        } catch (error) {
            console.log("erro: ", error);
        }
    }

    function renderCategories(categories) {
        if (!categoryShelf) return;
        if (categories.length === 0) {
            categoryShelf.innerHTML = "";
            return;
        }
        categoryShelf.innerHTML = categories
            .map(
                c => `
                <a class="category-item" data-cat="${c.slug}">
                 <div class="category-icon">
                    <i data-lucide="${c.slug}"></i>
                  </div>  <span>${c.name}</span>
                </a>
            `
            )
            .join("");
        try {
            lucide.createIcons();
        } catch (e) {
            console.error("erro: ", e);
        }
        const allCategory = document.querySelector(
            '.category-item[data-cat="all"]'
        );
        if (allCategory) {
            allCategory.classList.add("active");
        }
    }

    function renderFilters(categories) {
        if (!filtersContainer) return;
        filtersContainer.innerHTML = "";
        const allBtn = document.createElement("button");
        allBtn.className = "filter-btn active";
        allBtn.dataset.filter = "all";
        allBtn.textContent = "Todos";
        filtersContainer.appendChild(allBtn);

        categories.forEach(cat => {
            const filterBtn = document.createElement("button");
            filterBtn.className = "filter-btn";
            filterBtn.dataset.filter = cat.slug;
            filterBtn.textContent = cat.name;
            filtersContainer.appendChild(filterBtn);
        });
    }

    function renderProductCard(product) {
        const productCard = document.createElement("article");
        productCard.className = "product-card";
        productCard.dataset.category = product.category;

        let tagHTML = product.tag
            ? `<div class="product-tag ${product.tag.toLowerCase()}">${
                  product.tag
              }</div>`
            : "";

        const imageUrl =
            product.image_url || "assets/images/placeholders/product.png";
        const sellerAvatar =
            product.seller_avatar || "assets/images/placeholders/avatar.png";
        const description = product.description || "";
        const rating = Math.round(product.rating || 0);
        const reviews_count = product.reviews_count || 0;

        productCard.innerHTML = `
<a href="details/product-details.html?id=${
            product.id
        }" class="product-link" data-property-id="${product.id}">
    <div class="product-image">
        <img src="${imageUrl}" alt="${product.name}" loading="lazy">
        ${tagHTML}
    </div>
  <div class="product-card-footer">
    <div class="product-info">
        <h3>${product.name}</h3>
        <p class="product-price">
            ${parseFloat(product.price).toLocaleString("pt-AO")}Kz
        </p></div>
          
            <div class="card-actions">
                <button class="btn-wishlist" aria-label="Adicionar aos favoritos">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
                <button class="btn-cart" aria-label="Adicionar ao carrinho">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0
                        2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                </button>
            </div>
        </div>
    
</a>
`;
        const cartButton = productCard.querySelector(".btn-cart");
        cartButton.addEventListener("click", (event) => {
            event.preventDefault();
            showToast("Produto adicionado ao carrinho!");
        });

        const wishlistButton = productCard.querySelector(".btn-wishlist");
        wishlistButton.addEventListener("click", (event) => {
            event.preventDefault();
            showToast("Produto adicionado aos favoritos!");
        });
        return productCard;
    }

    function renderProducts(container, productsToRender) {
        if (!container) return;
        if (productsToRender.length === 0) {
            container.innerHTML = "<p>Nenhum produto encontrado.</p>";
            return;
        }
        container.innerHTML = "";
        productsToRender.forEach(product => {
            const productCard = renderProductCard(product);
            container.appendChild(productCard);
        });
        try {
            lucide.createIcons();
        } catch (e) {
            console.error("Erro ao criar ícones Lucide:", e);
        }
    }

    function renderSellers(sellersToRender) {
        if (!sellersGrid) return;
        if (sellersToRender.length === 0) {
            sellersGrid.innerHTML = "<p>Nenhum vendedor encontrado.</p>";
            return;
        }
        sellersGrid.innerHTML = "";
        sellersToRender.forEach((seller, index) => {
            const sellerCard = document.createElement("div");
            sellerCard.className = "seller-card fade-in";
            sellerCard.style.transitionDelay = `${index * 0.1}s`;
            sellerCard.innerHTML = `
                    <img src="${
                        seller.avatar || "assets/images/placeholders/avatar.png"
                    }" alt="${seller.name}" loading="lazy">
                    <h3>${seller.name}</h3>
                    <p>${seller.specialty || ""}</p>
                `;
            sellersGrid.appendChild(sellerCard);
        });
    }

    try {
        lucide.createIcons();
    } catch (e) {
        console.error("Erro ao criar ícones Lucide:", e);
    }

    function setupFiltering() {
        const filterButtons = document.querySelectorAll(".filter-btn");
        const productCards = document.querySelectorAll(".product-card");

        if (filterButtons.length === 0) return;

        filterButtons.forEach(button => {
            button.addEventListener("click", () => {
                const filter = button.dataset.filter;

                filterButtons.forEach(btn => btn.classList.remove("active"));
                button.classList.add("active");

                productCards.forEach(card => {
                    card.classList.add("hidden");
                    setTimeout(() => {
                        if (
                            filter === "all" ||
                            card.dataset.category === filter
                        ) {
                            card.style.display = "flex";
                            setTimeout(
                                () => card.classList.remove("hidden"),
                                20
                            );
                        } else {
                            card.style.display = "none";
                        }
                    }, 200);
                });
            });
        });
    }

    function setupHeaderScroll() {
        const header = document.getElementById("mainHeader");
        if (header) {
            window.addEventListener("scroll", () => {
                header.classList.toggle("scrolled", window.scrollY > 50);
            });
        }
    }

    setupHeaderScroll();
    const currentYear = document.getElementById("currentYear");
    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }
});
