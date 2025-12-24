import { showToast } from "../notifications.js";
import {
  getUserProfile,
  getProductsByUser,
  followUser,
  unfollowUser,
} from "../services/api.js";
import { getUserSession } from "../auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const userNameElement = document.getElementById("user-name");
  const userBioElement = document.getElementById("user-bio");
  const userAvatarElement = document.getElementById("user-avatar");
  const productsCountElement = document.getElementById("products-count");
  const followersCountElement = document.getElementById("followers-count");
  const followingCountElement = document.getElementById("following-count");
  const userProductsGrid = document.getElementById("user-products-grid");
  const followBtn = document.getElementById("follow-btn");
  const messageBtn = document.getElementById("message-btn");
  const noProductsMessage = document.getElementById("no-products-message");

  const currentUser = getUserSession()?.user;
  const params = new URLSearchParams(window.location.search);
  const userId = params.get("id");

  if (!userId) {
    // Redirect or show error if no user ID is provided
    window.location.href = "/explore.html";
    return;
  }

  const renderUserProfile = (user) => {
    document.title = `${user.name} - Bazar Bié Okutuala`;
    userNameElement.textContent = user.name;
    document.getElementById("user-name-placeholder").textContent = user.name;
    userBioElement.textContent =
      user.bio || "Este utilizador ainda não adicionou uma biografia.";
    userAvatarElement.src =
      user.avatar_url || "../assets/images/placeholders/avatar.png";
    productsCountElement.textContent = user.products_count || 0;
    followersCountElement.textContent = user.followers_count || 0;
    followingCountElement.textContent = user.following_count || 0;

    // Setup follow button
    if (currentUser && currentUser.id !== user.id) {
      followBtn.style.display = "inline-block";
      messageBtn.style.display = "inline-block";
      updateFollowButton(user.is_following);
    } else {
      followBtn.style.display = "none";
      messageBtn.style.display = "none";
    }
  };

  const renderUserProducts = (products) => {
    userProductsGrid.innerHTML = "";
    if (!products || products.length === 0) {
      noProductsMessage.style.display = "flex";
      return;
    }
    noProductsMessage.style.display = "none";

    products.forEach((product) => {
      const productCard = document.createElement("div");
      productCard.className = "product-card";
      const imageUrl =
        product.images && product.images.length > 0
          ? product.images[0].image_url
          : "../assets/images/placeholders/product.png";
      const priceFormatted = new Intl.NumberFormat("pt-AO", {
        style: "currency",
        currency: "AOA",
      }).format(product.price);

      productCard.innerHTML = `
                <a href="../product.html?id=${product.id}" class="product-image-link">
                    <img src="${imageUrl}" alt="${product.name}" class="product-image">
                </a>
                <div class="product-info">
                    <a href="../product.html?id=${product.id}">
                        <h3 class="product-title">${product.name}</h3>
                    </a>
                    <p class="product-price">${priceFormatted}</p>
                </div>
            `;
      userProductsGrid.appendChild(productCard);
    });
  };

  const updateFollowButton = (isFollowing) => {
    if (isFollowing) {
      followBtn.textContent = "A Seguir";
      followBtn.classList.remove("btn-primary");
      followBtn.classList.add("btn-secondary");
    } else {
      followBtn.textContent = "Seguir";
      followBtn.classList.remove("btn-secondary");
      followBtn.classList.add("btn-primary");
    }
    followBtn.dataset.following = isFollowing;
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      showToast("Precisa de iniciar sessão para seguir utilizadores.", "info");
      return;
    }

    const isFollowing = followBtn.dataset.following === "true";
    followBtn.disabled = true;

    try {
      let response;
      if (isFollowing) {
        response = await unfollowUser(userId);
      } else {
        response = await followUser(userId);
      }
      updateFollowButton(!isFollowing);
      followersCountElement.textContent = response.data.followers_count;
    } catch (error) {
      showToast("Ocorreu um erro. Tente novamente.", "error");
    } finally {
      followBtn.disabled = false;
    }
  };

  const init = async () => {
    try {
      const [profileResponse, productsResponse] = await Promise.all([
        getUserProfile(userId),
        getProductsByUser(userId),
      ]);
      renderUserProfile(profileResponse.data);
      renderUserProducts(productsResponse.data);
    } catch (error) {
      showToast("Erro ao carregar o perfil do utilizador.", "error");
      document.querySelector("main").innerHTML =
        '<p class="text-center error">Não foi possível encontrar este utilizador.</p>';
    }
  };

  followBtn.addEventListener("click", handleFollowToggle);
  messageBtn.addEventListener("click", () => {
    // This should ideally create a new conversation and redirect to messages page
    window.location.href = `../messages.html?userId=${userId}`;
  });

  init();
});
