const meili = require("../src/config/meilisearch.js");

(async () => {
  try {
    const index = meili.index("products");

    // Criação do índice com settings otimizados
    await index.updateSettings({
      searchableAttributes: ["name", "description", "category", "tag"],
      filterableAttributes: ["category", "price", "currency", "stock", "seller_id"],
      sortableAttributes: ["price", "created_at", "stock"],
      rankingRules: [
        "typo",
        "words",
        "proximity",
        "attribute",
        "sort",
        "exactness"
      ],
      displayedAttributes: [
        "id", "name", "description", "price", "currency", "category",
        "image_url", "seller_id", "stock", "tag", "created_at"
      ],
    });

    console.log("✅ Índice 'products' configurado com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao configurar Meili:", err.message);
  }
})();