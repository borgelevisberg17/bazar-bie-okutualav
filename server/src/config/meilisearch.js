const { MeiliSearch } = require("meilisearch");

const host = process.env.MEILI_HOST || "http://localhost:7700";
const apiKey = process.env.MEILI_MASTER_KEY || "";

let meili;

try {
  meili = new MeiliSearch({ host, apiKey });
  
  // Verificação básica de saúde (não bloqueante)
  if (process.env.NODE_ENV !== "production") {
    meili.isHealthy().then(h => {
      if (h) console.log(`🔍 MeiliSearch ativo em: ${host}`);
    }).catch(() => {
      console.warn(`⚠️ MeiliSearch não encontrado em: ${host}. Funcionalidades de busca podem falhar.`);
    });
  }
} catch (error) {
  console.error("❌ Erro ao inicializar MeiliSearch:", error.message);
  meili = {
    index: () => ({
      search: async () => ({ hits: [], message: "Search service unavailable" }),
      addDocuments: async () => ({ message: "Search service unavailable" })
    })
  };
}

module.exports = meili;
