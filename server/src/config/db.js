// server/src/config/db.js
const chalk = require("chalk");
let db, mode, pgp;

const log = {
    info: msg => console.log(chalk.blueBright(`[INFO] ${msg}`)),
    success: msg => console.log(chalk.greenBright(`[OK] ${msg}`)),
    warn: msg => console.log(chalk.yellowBright(`[WARN] ${msg}`)),
    error: msg => console.log(chalk.redBright(`[ERROR] ${msg}`))
};

const memoryCache = new Map();
const useCache = process.env.NODE_ENV === "development";

// Prioridade de conexão: 
// 1. DATABASE_URL (Produção/Docker)
// 2. SUPABASE (Se configurado)
// 3. DATABASE_URL_LOCAL (Desenvolvimento)

if (process.env.DATABASE_URL) {
    pgp = require("pg-promise")({});
    db = pgp(process.env.DATABASE_URL);
    mode = "pg";
    log.info("🔌 Conectado ao BANCO via DATABASE_URL");
} else if (
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
) {
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
    );
    mode = "supabase";

    db = {
        select: async (table, cols = "*", filter = {}) => {
            const { data, error } = await supabase.from(table).select(cols).match(filter);
            if (error) throw error;
            return data;
        },
        insert: async (table, data) => {
            const { data: inserted, error } = await supabase.from(table).insert(data).select();
            if (error) throw error;
            return inserted;
        },
        update: async (table, data, filter) => {
            const { data: updated, error } = await supabase.from(table).update(data).match(filter).select();
            if (error) throw error;
            return updated;
        },
        delete: async (table, filter) => {
            const { error } = await supabase.from(table).delete().match(filter);
            if (error) throw error;
        },
        rpc: async (fn, params) => {
            const { data, error } = await supabase.rpc(fn, params);
            if (error) throw error;
            return data;
        }
    };
    log.info("☁️ Conectado ao BANCO SUPABASE via supabase-js");
} else if (process.env.DATABASE_URL_LOCAL) {
    pgp = require("pg-promise")({});
    db = pgp(process.env.DATABASE_URL_LOCAL);
    mode = "pg";
    log.info("💻 Conectado ao BANCO LOCAL via pg-promise");
} else {
    // Fallback para desenvolvimento local padrão se nada for fornecido
    pgp = require("pg-promise")({});
    db = pgp("postgres://bazar:bazarpass@localhost:5432/bazar");
    mode = "pg";
    log.warn("⚠️ Usando configuração de banco padrão (localhost)");
}

db.runQuery = async (sql, params = []) => {
    if (mode !== "pg") throw new Error("⚠️ Query raw não suportada no modo Supabase JS Client.");

    const cacheKey = `${sql}-${JSON.stringify(params)}`;
    if (useCache && memoryCache.has(cacheKey)) return memoryCache.get(cacheKey);

    try {
        const result = await db.any(sql, params);
        if (useCache) memoryCache.set(cacheKey, result);
        return result;
    } catch (err) {
        log.error(`❌ Query error: ${sql} - ${err.message}`);
        throw err;
    }
};

db.safeTransaction = async callback => {
    if (mode === "pg") {
        return db.tx(async t => {
            try {
                return await callback(t);
            } catch (err) {
                log.error("💣 Erro na transação: " + err.message);
                throw err;
            }
        });
    } else {
        return callback(db);
    }
};

const close = () => { if (pgp) pgp.end(); };

module.exports = { db, mode, close, pgp };
