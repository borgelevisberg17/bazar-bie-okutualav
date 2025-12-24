// frontend/public/assets/js/main.js
import { getProducts } from "./services/api.js";
import { showToast } from "./notifications.js";
import { ProductCard } from "./ui/components/ProductCard.js";

const { createApp, ref, onMounted } = Vue;

createApp({
  components: {
    ProductCard,
  },
  setup() {
    const products = ref([]);
    const currentPage = ref(1);
    const isLoading = ref(false);
    const hasMore = ref(true);

    const loadProducts = async () => {
      if (isLoading.value || !hasMore.value) return;
      isLoading.value = true;

      try {
        const response = await getProducts(currentPage.value, 10);
        const newProducts = response?.data || [];
        if (newProducts.length > 0) {
          products.value = [...products.value, ...newProducts];
          currentPage.value++;
        }
        if (newProducts.length < 10) {
          hasMore.value = false;
        }
      } catch (error) {
        showToast("Erro ao carregar o feed.", "error");
        hasMore.value = false;
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(() => {
      loadProducts(); // Load initial products
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore.value) {
            loadProducts();
          }
        },
        { threshold: 0.5 },
      );
      observer.observe(document.getElementById("sentinel"));
    });

    return {
      products,
      isLoading,
      hasMore,
    };
  },
}).mount("#social-feed-app");
