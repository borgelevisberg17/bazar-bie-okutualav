import {
  getProductById,
  likeProduct,
  unlikeProduct,
  addComment,
} from "./services/api.js";
import { showToast } from "./notifications.js";
import { getSession } from "./auth.js";

const { createApp, ref, onMounted, computed } = Vue;

createApp({
  setup() {
    // STATE
    const productId = ref(null);
    const currentUser = ref(getSession()?.user);
    const product = ref(null);
    const isLoading = ref(true);
    const error = ref(null);
    const selectedImage = ref(null);
    const newCommentText = ref("");

    // COMPUTED PROPERTIES
    const mainImage = computed(() => {
      if (selectedImage.value) return selectedImage.value;
      return (
        product.value?.images?.[0]?.image_url ||
        "assets/images/placeholders/product-main.png"
      );
    });

    const formattedPrice = computed(() => {
      if (!product.value?.price) return "";
      return new Intl.NumberFormat("pt-AO", {
        style: "currency",
        currency: "AOA",
      }).format(product.value.price);
    });

    // METHODS
    const changeImage = (imageUrl) => {
      selectedImage.value = imageUrl;
    };

    const handleLikeToggle = async () => {
      if (!currentUser.value) {
        showToast("Precisa de iniciar sessão para gostar de produtos.", "info");
        return;
      }

      const isLiked = product.value.is_liked;
      const originalLikesCount = product.value.likes_count;

      // Optimistic UI update
      product.value.is_liked = !isLiked;
      product.value.likes_count += isLiked ? -1 : 1;

      try {
        const response = isLiked
          ? await unlikeProduct(product.value.id)
          : await likeProduct(product.value.id);
        // Sync with server state
        product.value.likes_count = response.data.likes_count;
      } catch (err) {
        showToast("Ocorreu um erro ao processar o seu gosto.", "error");
        // Revert UI on error
        product.value.is_liked = isLiked;
        product.value.likes_count = originalLikesCount;
      }
    };

    const handleAddComment = async () => {
      if (!currentUser.value) {
        showToast("Precisa de iniciar sessão para comentar.", "info");
        return;
      }
      if (!newCommentText.value.trim()) {
        showToast("O comentário não pode estar vazio.", "error");
        return;
      }

      try {
        const response = await addComment(product.value.id, newCommentText.value);
        // Assuming the API returns the new comment with user details
        product.value.comments.unshift(response.data);
        product.value.comments_count++;
        newCommentText.value = "";
        showToast("Comentário adicionado com sucesso!", "success");
      } catch (err) {
        showToast("Ocorreu um erro ao adicionar o comentário.", "error");
      }
    };

    const openWhatsApp = () => {
        const message = `Olá, tenho interesse no produto ${product.value.name}. ${window.location.href}`;
        const whatsappUrl = `https://wa.me/${product.value.seller.phone_number}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");
    }

    // LIFECYCLE HOOK
    onMounted(async () => {
      productId.value = new URLSearchParams(window.location.search).get("id");
      if (!productId.value) {
        error.value = "Produto não encontrado. ID inválido.";
        isLoading.value = false;
        return;
      }

      try {
        const response = await getProductById(productId.value);
        product.value = response.data;
        document.title = `${product.value.name} - Bazar Bié Okutuala`;
      } catch (err) {
        error.value = "Ocorreu um erro ao carregar este produto.";
      } finally {
        isLoading.value = false;
      }
    });

    return {
      product,
      isLoading,
      error,
      currentUser,
      newCommentText,
      mainImage,
      formattedPrice,
      changeImage,
      handleLikeToggle,
      handleAddComment,
      openWhatsApp,
    };
  },
}).mount("#product-details-page");
