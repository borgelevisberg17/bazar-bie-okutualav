import { getSession } from "./auth.js";
import { getProductsBySeller } from "./services/api.js";
import { showToast } from "./notifications.js";

const userSession = getSession();
if (!userSession) {
  window.location.href = "/auth/login.html";
}

const { createApp, ref, onMounted } = Vue;

createApp({
  setup() {
    // Reactive state
    const user = ref(userSession?.user || {});
    const products = ref([]);
    const isLoading = ref(true);

    // Methods
    const loadUserProducts = async () => {
      if (user.value.role !== "seller") {
        isLoading.value = false;
        return;
      }
      try {
        const response = await getProductsBySeller(user.value.id);
        products.value = response.data;
      } catch (error) {
        showToast("Erro ao carregar os seus produtos.", "error");
      } finally {
        isLoading.value = false;
      }
    };

    const formatPrice = (price) => {
      return new Intl.NumberFormat("pt-AO", {
        style: "currency",
        currency: "AOA",
      }).format(price);
    };

    // Lifecycle hooks
    onMounted(() => {
      document.title = `Meu Perfil - ${user.value.name} - Bazar Bié Okutuala`;
      loadUserProducts();
    });

    // Expose to template
    return {
      user,
      products,
      isLoading,
      formatPrice,
    };
  },
}).mount("#profile-page-content");
