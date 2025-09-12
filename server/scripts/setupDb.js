const fs = require("fs");
const path = require("path");
const db = require("../src/config/db.js");

(async () => {
  try {
    const schemaPath = path.join(__dirname, "..", "migrations", "010_full_schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf8");
    await db.none(sql);
    console.log("✅ Migração aplicada com sucesso!");
  } catch (err) {
    console.error("❌ Erro na migração:", err.message);
  } finally {
    process.exit(0);
  }
})();