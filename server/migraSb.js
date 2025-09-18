/**
 * Rodar migrations no Supabase via REST API (funciona no Free Tier)
 */
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    const dir = path.join(__dirname, "migrations");
    const files = fs.readdirSync(dir).sort();

    for (const f of files) {
      const sql = fs.readFileSync(path.join(dir, f), "utf8");
      console.log("Running", f);

      const { error } = await supabase.rpc("exec_sql", { query: sql });

      if (error) {
        throw error;
      }
    }

    console.log("✅ Migrations complete");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  }
})();