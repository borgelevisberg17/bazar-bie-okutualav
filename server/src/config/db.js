// server/src/config/db.js
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const chalk = require("chalk"); // 🔹 Melhor visual para logs
let db, mode;

const log = {
    info: msg => console.log(chalk.blueBright(`[INFO] ${msg}`)),
    success: msg => console.log(chalk.greenBright(`[OK] ${msg}`)),
    warn: msg => console.log(chalk.yellowBright(`[WARN] ${msg}`)),
    error: msg => console.log(chalk.redBright(`[ERROR] ${msg}`))
};

// 🔹 Cache simples em memória para consultas repetidas (apenas em DEV)
const memoryCache = new Map();
const useCache = process.env.NODE_ENV === "development";

// ======================================================
// 🔸 CONEXÕES
// ======================================================
if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
    const pgp = require("pg-promise")({});
    db = pgp(
        process.env.DATABASE_URL_LOCAL ||
            "postgres://borge:senha@localhost:5432/bazar"
    );
    mode = "pg";
    log.info("💻 Conectado ao BANCO LOCAL via pg-promise (DEV/TEST)");
} else if (
    process.env.NODE_ENV === "production" &&
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
            const { data, error } = await supabase
                .from(table)
                .select(cols)
                .match(filter);
            if (error) throw error;
            return data;
        },
        insert: async (table, data) => {
            const { data: inserted, error } = await supabase
                .from(table)
                .insert(data)
                .select();
            if (error) throw error;
            return inserted;
        },
        update: async (table, data, filter) => {
            const { data: updated, error } = await supabase
                .from(table)
                .update(data)
                .match(filter)
                .select();
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
    log.info("☁️ Conectado ao BANCO SUPABASE via supabase-js (Free Tier)");
} else if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
    const pgp = require("pg-promise")({});
    db = pgp(process.env.DATABASE_URL);
    mode = "pg";
    log.info("🔌 Conectado ao BANCO REMOTO Postgres via DATABASE_URL");
} else {
    throw new Error("❌ Nenhuma configuração de banco encontrada no .env");
}

// ======================================================
// 🔸 MÉTODOS UTILITÁRIOS
// ======================================================

// Query com log, cache e fallback automático
db.runQuery = async (sql, params = []) => {
    if (mode !== "pg")
        throw new Error("⚠️ Query raw não suportada neste modo.");

    const cacheKey = `${sql}-${JSON.stringify(params)}`;
    if (useCache && memoryCache.has(cacheKey)) {
        log.info(`🧠 Cache hit: ${sql}`);
        return memoryCache.get(cacheKey);
    }

    const start = Date.now();
    try {
        const result = await db.any(sql, params);
        const duration = Date.now() - start;
        log.success(`✅ Query OK (${duration}ms): ${sql}`);

        if (useCache) memoryCache.set(cacheKey, result);
        return result;
    } catch (err) {
        log.error(`❌ Query error: ${sql}`);
        log.error(err.message);

        // Fallback simples (exemplo: tentar novamente)
        try {
            log.warn("🔁 Tentando reconectar...");
            const pgp = require("pg-promise")({});
            db = pgp(
                process.env.DATABASE_URL_Local || process.env.DATABASE_URL
            );
            return await db.any(sql, params);
        } catch (fallbackErr) {
            log.error("❌ Fallback falhou: " + fallbackErr.message);
            throw fallbackErr;
        }
    }
};

// Transações seguras
db.safeTransaction = async callback => {
    if (mode === "pg") {
        return db.tx(async t => {
            try {
                const result = await callback(t);
                log.success("🧾 Transação concluída com sucesso.");
                return result;
            } catch (err) {
                log.error("💣 Erro durante transação: " + err.message);
                throw err;
            }
        });
    } else {
        log.warn("⚠️ Transações não suportadas no Supabase Free Tier.");
        return callback(db);
    }
};

let pgp;
if (mode === 'pg') {
    pgp = require('pg-promise')();
}

const close = () => {
    if (pgp) {
        pgp.end();
    }
};

module.exports = { db, mode, close };
