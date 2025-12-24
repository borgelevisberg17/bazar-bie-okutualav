import { getCategories } from "./services/api.js";
import { showToast } from "./notifications.js";

document.addEventListener("DOMContentLoaded", () => {
  const categoriesContainer = document.getElementById("categories-container");

  const renderCategories = (categories) => {
    if (!categoriesContainer) return;

    if (categories.length === 0) {
      categoriesContainer.innerHTML = "<p>Nenhuma categoria encontrada.</p>";
      return;
    }

    const categoriesHTML = categories
      .map(
        (category) => `
            <a href="/explore.html?category=${category.slug}" class="category-card">
                <div class="category-card-content">
                    <h3 class="category-card-title">${category.name}</h3>
                </div>
            </a>
        `,
      )
      .join("");

    categoriesContainer.innerHTML = categoriesHTML;
  };

  const init = async () => {
    try {
      const response = await getCategories();
      renderCategories(response.data);
    } catch (error) {
      showToast("Erro ao carregar as categorias.", "error");
      if (categoriesContainer) {
        categoriesContainer.innerHTML =
          "<p>Ocorreu um erro ao carregar as categorias. Tente novamente mais tarde.</p>";
      }
    }
  };

  init();
});
