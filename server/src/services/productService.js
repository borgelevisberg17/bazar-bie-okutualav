const repo = require("../repositories/productsRepo");
const cacheService = require("./cacheService");
const search = require("./searchService");

const PRODUCTS_CACHE_KEY = (options) =>
    `products:page:${options.page}:limit:${options.limit}:status:${options.status || ""}:seller:${options.sellerId || ""}`;
const PRODUCT_DETAILS_CACHE_KEY = (id) => `product:details:${id}`;

exports.list = async (options) => {
    const cacheKey = PRODUCTS_CACHE_KEY(options);
    return cacheService.getOrSet(cacheKey, () => repo.list(options));
};

exports.get = (id) => repo.get(id);

exports.getDetails = (id) => {
    const cacheKey = PRODUCT_DETAILS_CACHE_KEY(id);
    return cacheService.getOrSet(cacheKey, () => repo.getDetails(id));
};

exports.create = async (sellerUid, payload) => {
    const product = await repo.create(sellerUid, payload);
    cacheService.del(PRODUCTS_CACHE_KEY({ page: 1, limit: 10, status: "approved" }));
    search.indexProduct(product).catch(() => {});
    return product;
};

exports.update = (id, payload) => {
    cacheService.del(PRODUCT_DETAILS_CACHE_KEY(id));
    return repo.update(id, payload);
};

exports.remove = async (id) => {
    await repo.remove(id);
    cacheService.del(PRODUCT_DETAILS_CACHE_KEY(id));
    await search.removeProduct(id).catch(() => {});
};

exports.like = async (productId, userId) => {
    const result = await repo.like(productId, userId);
    cacheService.del(PRODUCT_DETAILS_CACHE_KEY(productId));
    return result;
};

exports.unlike = async (productId, userId) => {
    const result = await repo.unlike(productId, userId);
    cacheService.del(PRODUCT_DETAILS_CACHE_KEY(productId));
    return result;
};

exports.addComment = async (productId, userId, comment) => {
    const result = await repo.addComment(productId, userId, comment);
    cacheService.del(PRODUCT_DETAILS_CACHE_KEY(productId));
    return result;
};
