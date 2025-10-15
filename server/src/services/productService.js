const repo = require("../repositories/productsRepo");
const search = require("./searchService");

// 📜 Listar com paginação e busca
exports.list = async ({ page, limit, q, status }) => {
  if (q) return search.searchProducts(q, { page, limit });
  return repo.list({ page, limit, status });
};

// 📜 Buscar por ID
exports.get = (id) => repo.get(id);

// ➕ Criar (delegado pro repo + indexação async no Meili)
exports.create = async (sellerUid, payload) => {
  const product = await repo.create(sellerUid, payload);
  search.indexProduct(product).catch(() => {}); // async sem travar
  return product;
};

// ✏️ Atualizar
exports.update = (id, payload) => repo.update(id, payload);

// ❌ Remover (DB + remover índice)
exports.remove = async (id) => {
  await repo.remove(id);
  await search.removeProduct(id).catch(() => {});
};