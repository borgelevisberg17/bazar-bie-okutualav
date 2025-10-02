// server/src/config/db.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

let db, mode;

if (process.env.NODE_ENV === 'development'  && process.env.DATABASE_URL_Local) {
  // 🔹 Banco local (DEV) com pg-promise
  const pgp = require('pg-promise')({});
  db = pgp(process.env.DATABASE_URL_Local);
  mode = 'pg';
  console.log('💻 Conectado ao BANCO LOCAL via pg-promise (DEV)');

} 
else if (process.env.NODE_ENV === 'production' && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // 🔹 Supabase Free Tier com supabase-js
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  mode = 'supabase';

  // Wrappers padronizados
  db = {
    select: async (table, cols = '*', filter = {}) => {
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

  console.log('☁️ Conectado ao BANCO SUPABASE via supabase-js (Free Tier)');
} 
else if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  // 🔹 Supabase Pro / qualquer Postgres remoto
  const pgp = require('pg-promise')({});
  db = pgp(process.env.DATABASE_URL);
  mode = 'pg';
  console.log('🔌 Conectado ao BANCO REMOTO Postgres via DATABASE_URL');
} 
else {
  throw new Error('❌ Nenhuma configuração de banco encontrada no .env');
}

// Função utilitária para queries raw
db.query = async (sql, params = []) => {
  if (mode === 'pg') {
    return db.any(sql, params);
  } else {
    throw new Error('⚠️ Query raw não suportada no Supabase Free Tier');
  }
};

// Função utilitária para transações
db.transaction = async (callback) => {
  if (mode === 'pg') {
    return db.tx(callback);
  } else {
    // No Supabase Free Tier não há transação nativa → executa callback simples
    return callback({
      select: db.select,
      insert: db.insert,
      update: db.update,
      delete: db.delete
    });
  }
};

module.exports = { db, mode };