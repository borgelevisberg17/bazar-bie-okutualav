import { getProducts, getCategories } from "./services/api.js";
import { showToast } from "./notifications.js";

document.addEventListener("DOMContentLoaded", () => {
  const productsGrid = document.getElementById("products-grid-explore");
  const categoryFilters = document.getElementById("category-filters");
  const loadingAnimation = document.getElementById("loading-animation");
  const priceRange = document.getElementById("price-range");
  const priceValue = document.getElementById("price-value");

  let currentPage = 1;
  let currentCategory = null;
  let currentMaxPrice = 100000;

  const renderProducts = (products) => {
    if (!productsGrid) return;

    if (products.length === 0 && currentPage === 1) {
      productsGrid.innerHTML =
        "<p>Nenhum produto encontrado com os filtros selecionados.</p>";
      return;
    }

    const productsHTML = products
      .map((product) => {
        const priceFormatted = new Intl.NumberFormat("pt-AO", {
          style: "currency",
          currency: "AOA",
        }).format(product.price);
        return `
                <div class="product-card">
                    <a href="/product.html?id=${product.id}" class="product-card__image-container">
                        <img src="${product.image_url || "assets/images/placeholders/product.png"}" alt="${product.name}" class="product-card__image">
                    </a>
                    <div class="product-card__content">
                        <a href="/product.html?id=${product.id}" class="product-card__title">${product.name}</a>
                        <p class="product-card__price">${priceFormatted}</p>
                        <a href="/seller.html?id=${product.seller_id}" class="product-card__seller">
                            <img src="${product.seller_avatar_url || "assets/images/placeholders/avatar.png"}" alt="${product.seller_name}" class="product-card__seller-avatar">
                            <span class="product-card__seller-name">${product.seller_name}</span>
                        </a>
                    </div>
                </div>
            `;
      })
      .join("");

    if (currentPage === 1) {
      productsGrid.innerHTML = productsHTML;
    } else {
      productsGrid.insertAdjacentHTML("beforeend", productsHTML);
    }
  };

  const renderCategories = (categories) => {
    if (!categoryFilters) return;
    const categoriesHTML = categories
      .map(
        (category) => `
            <div class="category-filter-item" data-category="${category.slug}">
                <i class="${category.icon || "fas fa-tag"}"></i>
                <span>${category.name}</span>
            </div>
        `,
      )
      .join("");
    categoryFilters.innerHTML = categoriesHTML;

    document.querySelectorAll(".category-filter-item").forEach((item) => {
      item.addEventListener("click", () => {
        currentCategory = item.dataset.category;
        currentPage = 1;
        loadProducts();
        document
          .querySelector(".category-filter-item.active")
          ?.classList.remove("active");
        item.classList.add("active");
      });
    });
  };

  const loadCategories = async () => {
    try {
      const response = await getCategories();
      renderCategories(response.data);
    } catch (error) {
      showToast("Erro ao carregar as categorias.", "error");
    }
  };

  let isLoading = false;
  let hasMore = true;

  const loadProducts = async () => {
    if (isLoading || !hasMore) return;
    isLoading = true;
    loadingAnimation.style.display = "block";

    try {
      const response = await getProducts(currentPage, 12, currentCategory);
      const products = response.data;
      renderProducts(products);

      if (products.length === 0) {
        hasMore = false;
      } else {
        currentPage++;
      }
    } catch (error) {
      showToast("Erro ao carregar os produtos.", "error");
    } finally {
      isLoading = false;
      loadingAnimation.style.display = "none";
    }
  };

  priceRange.addEventListener("input", () => {
    priceValue.textContent = `Kz ${new Intl.NumberFormat("pt-AO").format(priceRange.value)}`;
  });

  const setupInfiniteScroll = () => {
    const sentinel = document.createElement("div");
    sentinel.id = "sentinel";
    productsGrid.insertAdjacentElement("afterend", sentinel);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadProducts();
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(sentinel);
  };

  loadProducts();
  loadCategories();
  setupInfiniteScroll();
});
