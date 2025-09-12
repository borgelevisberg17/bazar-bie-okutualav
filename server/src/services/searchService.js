const meili = require("../config/meilisearch");

const index = () => meili.index("products");

// 📥 Indexar produto
exports.indexProduct = async (product) => {
  try {
    return await index().addDocuments([product]);
  } catch (err) {
    console.error("Erro ao indexar produto no Meili:", err.message);
    throw err;
  }
};

// ❌ Remover produto
exports.removeProduct = async (id) => {
  try {
    return await index().deleteDocument(id);
  } catch (err) {
    console.error("Erro ao remover produto do Meili:", err.message);
    throw err;
  }
};

// 🔎 Buscar produtos
exports.searchProducts = async (q, { page = 1, limit = 24 }) => {
  try {
    return await index().search(q, {
      limit,
      offset: (page - 1) * limit,
    });
  } catch (err) {
    console.error("Erro ao buscar produtos no Meili:", err.message);
    throw err;
  }
};