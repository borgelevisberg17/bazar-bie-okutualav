/**
 * Production Indexer Worker
 * Listens to pg_notify channel 'meili' and updates Meilisearch index automatically.
 */

const pgp = require('pg-promise')();
const { MeiliSearch } = require('meilisearch');

const DATABASE_URL = process.env.DATABASE_URL;
const MEILI_HOST = process.env.MEILI_HOST || 'http://localhost:7700';
const MEILI_MASTER_KEY = process.env.MEILI_MASTER_KEY || '';

const db = pgp(DATABASE_URL);
const meili = new MeiliSearch({ host: MEILI_HOST, apiKey: MEILI_MASTER_KEY });

/**
 * Updates a MeiliSearch index with a given payload.
 * @param {string} indexName - The name of the index to update.
 * @param {object} payload - The data from the PostgreSQL event.
 * @returns {Promise<void>}
 */
async function updateIndex(indexName, payload) {
  try {
    const index = meili.index(indexName);
    await index.addDocuments([payload]); // adiciona ou atualiza
    console.log(`✅ Meili index '${indexName}' atualizado com payload:`, payload);
  } catch (err) {
    console.error(`❌ Erro ao atualizar Meili index '${indexName}':`, err);
  }
}

/**
 * IIFE to connect to the PostgreSQL database and listen for notifications on the 'meili' channel.
 * When a notification is received, it parses the payload and updates the corresponding MeiliSearch index.
 */
(async () => {
  const client = await db.connect();

  try {
    await client.client.query('LISTEN meili');
    console.log('🚀 Listening to PostgreSQL channel "meili"...');

    client.client.on('notification', async (msg) => {
      try {
        const payload = JSON.parse(msg.payload);
        console.log('📢 Evento recebido do PostgreSQL:', payload);

        // Determina índice pelo tipo de tabela (exemplo: 'products', 'orders', etc.)
        const indexName = payload.table || 'default';
        await updateIndex(indexName, payload);
      } catch (e) {
        console.error('❌ Payload inválido:', e);
      }
    });

    client.client.on('error', (err) => {
      console.error('PostgreSQL client error:', err);
    });
  } catch (err) {
    console.error('Erro ao conectar/listen no PostgreSQL:', err);
  }
})();
