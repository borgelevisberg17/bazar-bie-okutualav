/**
 * Simple indexer worker example: listens to pg_notify channel 'meili' and logs payload.
 * In production, this should call Meilisearch / Elasticsearch to update index.
 */
const pgp = require('pg-promise')();
const cn = process.env.DATABASE_URL || 'postgres://borge:senha@localhost:5432/bazar';
const db = pgp(cn);

(async () => {
  const client = await db.connect();
  try {
    await client.client.query('LISTEN meili');
    console.log('Listening to meili channel...');
    client.client.on('notification', (msg) => {
      try {
        const payload = JSON.parse(msg.payload);
        console.log('meili event', payload);
        // TODO: call Meilisearch to update document
      } catch (e) {
        console.error('Invalid payload', e);
      }
    });
  } catch (err) {
    console.error(err);
  }
})().catch(console.error);
