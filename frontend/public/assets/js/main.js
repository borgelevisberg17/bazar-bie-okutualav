document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch("../database/data.json");
    const data = await response.json();
    // --- DADOS MOCK ---
    const categories = data.categories; // já é um array
    const products = data.products;     // já é um array
    const sellers = data.sellers;       // já é um array
    const track = document.querySelector(".carousel-track");
    const dots = document.querySelectorAll(".dot");

    track.addEventListener("scroll", () => {
        const index = Math.round(track.scrollLeft / track.offsetWidth);
        dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
    });

    dots.forEach((dot, i) => {
        dot.addEventListener("click", () => {
            track.scrollTo({ left: i * track.offsetWidth, behavior: "smooth" });
        });
    });
    // --- RENDERIZAÇÃO DINÂMICA ---

    const sellersGrid = document.getElementById("sellersGrid");
    const filtersContainer = document.getElementById("filters");
    const productsGrid = document.getElementById("products-grid");
    const recentArrived = document.getElementById("recently-arrived");
    const topFinds = document.getElementById("top-finds");
    const categoryShelf = document.getElementById("categorieList");
    function renderCategories() {
        categoryShelf.innerHTML = categories
            .map(
                c => `
                <a class="category-item" data-cat="${c.slug}">
                 <div class="category-icon">
                    <i data-lucide="${c.icon}"></i>
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
        document
            .querySelector('.category-item[data-cat="all"]')
            .classList.add("active");
    }

    function renderFilters() {
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

    function renderProducts(productsToRender) {
        productsGrid.innerHTML = "";
        productsToRender.forEach((product, index) => {
            const productCard = document.createElement("article");
            productCard.className = "product-card";
            productCard.dataset.category = product.category;

            let tagHTML = product.tag
                ? `<div class="product-tag ${product.tag.toLowerCase()}">${
                      product.tag
                  }</div>`
                : "";

            productCard.innerHTML = `
    <a href="#" class="product-link" data-property-id="${product.id}">
        <div class="product-image">
            <img src="${product.images[0]}" alt="${product.name}" loading="lazy">
            ${tagHTML}
            ${
                product.discount
                    ? `<span class="discount-badge">-${product.discount}%</span>`
                    : ""
            }
        </div>
        <div class="product-info">
            <h3>${product.name}</h3>
            <p class="product-price">
                ${
                    product.discount
                        ? `<span class="old-price">Kz ${product.price.toLocaleString(
                              "pt-AO"
                          )}</span> 
                       <span class="new-price">Kz ${(
                           product.price -
                           (product.price * product.discount) / 100
                       ).toLocaleString("pt-AO")}</span>`
                        : `Kz ${product.price.toLocaleString("pt-AO")}`
                }
            </p>
            <p class="product-desc">${
                product.description ??
                "Produto incrível disponível no bazar local!"
            }</p>
            <div class="product-rating">
                ${"★".repeat(product.rating || 4)}${"☆".repeat(
                    5 - (product.rating || 4)
                )}
                <span class="rating-count">(${product.reviews || 12})</span>
            </div>
            <div class="product-card-footer">
                <div class="seller-info">
                    <img src="${product.seller.avatar}" alt="${
                        product.seller.name
                    }" class="seller-avatar">
                    <span class="seller-name">${product.seller.name}</span>
                </div>
                <div class="card-actions">
   
  <button class="btn-like" aria-label="Gostei">
    <i data-lucide="heart"></i>
  </button>

  <button class="btn-share" aria-label="Compartilhar">
    <i data-lucide="share-2"></i>
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
        </div>
    </a>
`;
            try {
                lucide.createIcons();
            } catch (e) {
                console.error("Erro ao criar ícones Lucide:", e);
            }
            productsGrid.appendChild(productCard);
        });
    }
    // Sample data for recently arrived and top finds
    // Sample data for recently arrived and top finds with real web image links
    const recentlyArrivedData = data.recentlyArrivedD;
    const topFindsData = data.topFindsD;
   
    productsGrid.addEventListener('click', (e) => {
                const detailsButton = e.target.closest('.product-link');
                const favoriteButton = e.target.closest('.btn-like');

                if (detailsButton) {
                    const productId = detailsButton.dataset.propertyId;
                    console.log(`Navegando para detalhes do imóvel ID: ${productId}`);
                    // Mantendo a lógica original de navegação
                    localStorage.setItem('selectedPropertyId', productId);
                 window.location.href = `../product-details.html?id=${productId}`; // Descomente para usar
                 //   alert(`Redirecionando para a página de detalhes do imóvel ${propertyId}...`);
                }

                if (favoriteButton) {
                    favoriteButton.classList.toggle('active');
                }
            });

    // Function to render product cards
    function renderProductTop(products) {
        topFinds.innerHTML = ""; 
        // Clear existing content
        products.forEach((product, index) => {
            const card = document.createElement("div");
            card.className = "product-card";
            card.innerHTML = `
            <a href="#" class="product-link" >
                <div class="product-image">
                    <img src="${product.image}" alt="${
                        product.name
                    }" loading="lazy">
                    ${
                        product.discount
                            ? `<span class="discount-badge">-${product.discount}%</span>`
                            : ""
                    }
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">
                        ${
                            product.discount
                                ? `<span class="old-price">Kz ${product.originalPrice.toLocaleString(
                                      "pt-AO"
                                  )}</span>
                                   <span class="new-price">Kz ${product.discountPrice.toLocaleString(
                                       "pt-AO"
                                   )}</span>`
                                : `Kz ${product.originalPrice.toLocaleString(
                                      "pt-AO"
                                  )}`
                        }
                    </p>
                    ${
                        product.installments
                            ? `<p class="installments">À vista no Express ou Kz ${product.installments.amount.toLocaleString(
                                  "pt-AO"
                              )} em até ${product.installments.count}x</p>`
                            : ""
                    }
                    <div class="product-actions">
                    <button class="add-to-cart" data-property-id="${product.id}">Adicionar</button>
                    </div>
                </div>
            </a>
        `;
            topFinds.appendChild(card);
        });
    }
    
    function renderProductArrived(products) {
        recentArrived.innerHTML = ""; 
        // Clear existing content
        products.forEach((product, index) => {
            const card = document.createElement("div");
            card.className = "product-card";
            card.innerHTML = `
            <a href="#" class="product-link" >
                <div class="product-image">
                    <img src="${product.image}" alt="${
                        product.name
                    }" loading="lazy">
                    ${
                        product.discount
                            ? `<span class="discount-badge">-${product.discount}%</span>`
                            : ""
                    }
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">
                        ${
                            product.discount
                                ? `<span class="old-price">Kz ${product.originalPrice.toLocaleString(
                                      "pt-AO"
                                  )}</span>
                                   <span class="new-price">Kz ${product.discountPrice.toLocaleString(
                                       "pt-AO"
                                   )}</span>`
                                : `Kz ${product.originalPrice.toLocaleString(
                                      "pt-AO"
                                  )}`
                        }
                    </p>
                    ${
                        product.installments
                            ? `<p class="installments">À vista no Express ou Kz ${product.installments.amount.toLocaleString(
                                  "pt-AO"
                              )} em até ${product.installments.count}x</p>`
                            : ""
                    }
                    <div class="product-actions">
                    <button class="add-to-cart" data-property-id="${product.id}">Adicionar</button>
                    </div>
                </div>
            </a>
        `;
            recentArrived.appendChild(card);
        });
    }
    // Render the sections
recentArrived.addEventListener('click', (e) => {
                const detailsButton = e.target.closest('.add-to-cart');
                
                if (detailsButton) {
                    const productId = detailsButton.dataset.propertyId;
                    console.log(`Navegando para detalhes do imóvel ID: ${productId}`);
                    // Mantendo a lógica original de navegação
                    localStorage.setItem('selectedPropertyId', productId);
                 window.location.href = `../product-details.html?id=${productId}`; // Descomente para usar
                 //   alert(`Redirecionando para a página de detalhes do imóvel ${propertyId}...`);
                }

                
            });
topFinds.addEventListener('click', (e) => {
                const detailsButton = e.target.closest('.add-to-cart');
                
                if (detailsButton) {
                    const productId = detailsButton.dataset.propertyId;
                    console.log(`Navegando para detalhes do imóvel ID: ${productId}`);
                    // Mantendo a lógica original de navegação
                    localStorage.setItem('selectedPropertyId', productId);
                 window.location.href = `../product-details.html?id=${productId}`; // Descomente para usar
                 //   alert(`Redirecionando para a página de detalhes do imóvel ${propertyId}...`);
                }

                
            });

    const renderSellers = sellersToRender => {
        if (!sellersGrid) return;
        sellersGrid.innerHTML = "";
        sellersToRender.forEach((seller, index) => {
            const sellerCard = document.createElement("div");
            sellerCard.className = "seller-card fade-in";
            sellerCard.style.transitionDelay = `${index * 0.1}s`;
            sellerCard.innerHTML = `
                    <img src="${seller.avatar}" alt="${seller.name}" loading="lazy">
                    <h3>${seller.name}</h3>
                    <p>${seller.specialty}</p>
                `;
            sellersGrid.appendChild(sellerCard);
        });
    };

    // --- INICIALIZAÇÃO ---
    try {
        lucide.createIcons();
    } catch (e) {
        console.error("Erro ao criar ícones Lucide:", e);
    }

    // --- LÓGICA DE INTERAÇÃO ---
    function setupFiltering() {
        const filterButtons = document.querySelectorAll(".filter-btn");
        const productCards = document.querySelectorAll(".product-card");

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

    // --- INICIALIZAÇÃO ---
    renderProductArrived(recentlyArrivedData);
    renderProductTop(topFindsData);
    renderFilters();
    renderCategories();
    renderSellers(sellers);
    renderProducts(products);
    setupFiltering();
    setupHeaderScroll();
    document.getElementById("currentYear").textContent =
        new Date().getFullYear();
});
