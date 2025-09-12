const initDb = require("pg-promise")()({
  host: "localhost",
  port: 5432,
  user: "borge",
  password: "senha",
  database: "postgres" // conecta no postgres principal
});

(async () => {
  try {
    await initDb.none('CREATE DATABASE bazar');
    console.log("✅ Banco 'bazar' criado!");
  } catch (err) {
    if (err.message.includes("already exists")) {
      console.log("⚠️ Banco 'bazar' já existe, seguindo...");
    } else {
      throw err;
    }
  } finally {
    process.exit(0);
  }
})();