const { MeiliSearch } = require("meilisearch");

/**
 * MeiliSearch client instance.
 * @type {import('meilisearch').MeiliSearch}
 */
const meili = new MeiliSearch({
  host: process.env.MEILI_HOST || "http://localhost:7700",
  apiKey: process.env.MEILI_MASTER_KEY || "",
});

// Log simples para debug (apenas em dev)
if (process.env.NODE_ENV !== "production") {
  console.log("🔍 MeiliSearch conectado em:", process.env.MEILI_HOST || "http://localhost:7700");
}

module.exports = meili;
