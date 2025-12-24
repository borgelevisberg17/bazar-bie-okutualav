// frontend/public/assets/js/ui/components/ProductCard.js
import { showToast } from "../../notifications.js";
import { getSession } from "../../auth.js";

export const ProductCard = {
  props: {
    product: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const currentUser = Vue.ref(getSession());
    const carouselIndex = Vue.ref(0);

    const priceFormatted = new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
    }).format(props.product.price);

    const images =
      props.product.images && props.product.images.length > 0
        ? props.product.images
        : [{ image_url: "assets/images/placeholders/product.png" }];

    const nextImage = () => {
      carouselIndex.value = (carouselIndex.value + 1) % images.length;
    };
    const prevImage = () => {
      carouselIndex.value =
        (carouselIndex.value - 1 + images.length) % images.length;
    };

    const handleLike = async () => {
        // Implementation for liking a product will be added if needed
    };

    const shareProduct = () => {
        const productUrl = `${window.location.origin}/product.html?id=${props.product.id}`;
        navigator.clipboard.writeText(productUrl)
            .then(() => showToast("Link do produto copiado!", "success"))
            .catch(() => showToast("Erro ao copiar o link.", "error"));
    };

    return {
      product: props.product,
      priceFormatted,
      images,
      carouselIndex,
      nextImage,
      prevImage,
      handleLike,
      shareProduct
    };
  },
  template: `
        <article class="product-post-card">
            <header class="post-header">
                <a :href="'seller.html?id=' + product.seller?.id" class="seller-info">
                    <img :src="product.seller?.avatar_url || 'assets/images/placeholders/avatar.png'" :alt="product.seller?.name" class="seller-avatar">
                    <span class="seller-name">{{ product.seller?.name || 'Vendedor' }}</span>
                </a>
                <button class="post-options-btn"><i class="fas fa-ellipsis-h"></i></button>
            </header>

            <div class="post-image-carousel">
                <div class="carousel-track" :style="{ transform: 'translateX(-' + carouselIndex * 100 + '%)' }">
                    <div v-for="image in images" :key="image.image_url" class="carousel-slide">
                        <a :href="'product.html?id=' + product.id">
                            <img :src="image.image_url" :alt="product.name" class="product-image" loading="lazy">
                        </a>
                    </div>
                </div>
                <template v-if="images.length > 1">
                    <button @click="prevImage" class="carousel-btn prev" aria-label="Previous image"><i class="fas fa-chevron-left"></i></button>
                    <button @click="nextImage" class="carousel-btn next" aria-label="Next image"><i class="fas fa-chevron-right"></i></button>
                    <div class="carousel-dots">
                        <span v-for="(image, index) in images" :key="index" class="dot" :class="{ active: index === carouselIndex }" @click="carouselIndex = index"></span>
                    </div>
                </template>
            </div>

            <footer class="post-footer">
                <div class="post-actions">
                    <button class="action-btn like-btn" @click="handleLike" aria-label="Like">
                        <i class="far fa-heart"></i>
                    </button>
                    <a :href="'product.html?id=' + product.id + '#comments-section'" class="action-btn" aria-label="Comment">
                        <i class="far fa-comment"></i>
                    </a>
                    <button @click="shareProduct" class="action-btn" aria-label="Share"><i class="far fa-paper-plane"></i></button>
                </div>
                 <div class="post-description">
                    <a :href="'product.html?id=' + product.id" class="product-name-link">
                        <h3 class="product-name">{{ product.name }}</h3>
                    </a>
                    <p class="price">{{ priceFormatted }}</p>
                </div>
                <div class="post-stats">
                    <span class="likes-count">{{ product.likes_count || 0 }} gostos</span>
                </div>
                <div class="post-comments">
                     <a :href="'product.html?id=' + product.id + '#comments-section'" class="view-comments">
                       Ver todos os {{ product.comments_count || 0 }} comentários
                    </a>
                </div>
            </footer>
        </article>
    `,
};
