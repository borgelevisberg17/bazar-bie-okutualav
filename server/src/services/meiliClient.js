import { MeiliSearch } from "meilisearch";

/**
 * MeiliSearch client instance.
 * @module services/meiliClient
 */

/**
 * The configured MeiliSearch client.
 * @type {MeiliSearch}
 */
const meiliClient = new MeiliSearch({
  host: process.env.MEILI_HOST,
  apiKey: process.env.MEILI_MASTER_KEY,
});

export default meiliClient;
