// Skeleton indexer service (Meilisearch). Replace with working Meili client and credentials.
const meiliHost = process.env.MEILI_HOST;
const meiliKey = process.env.MEILI_MASTER_KEY;
module.exports = {
  async indexProduct(product) {
    console.log('Index product to Meili (placeholder)', product.id);
    // TODO: implement Meili client push
  }
};
