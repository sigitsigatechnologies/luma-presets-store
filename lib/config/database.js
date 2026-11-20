import pg from "pg";
import { config } from "./env.js";

const { Pool } = pg;

function buildConnection() {
  const raw = (config.database.url || process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
  if (!raw) return { connectionString: "", ssl: false };

  try {
    const url = new URL(raw);
    url.searchParams.delete("channel_binding");
    const sslmode = url.searchParams.get("sslmode");
    url.searchParams.delete("sslmode");
    const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const useSsl = !isLocal && (sslmode === "require" || sslmode === "verify-full" || url.hostname.includes("neon.tech"));
    return {
      connectionString: url.toString(),
      ssl: useSsl ? { rejectUnauthorized: false } : false
    };
  } catch {
    return { connectionString: raw, ssl: false };
  }
}

function getPool() {
  if (globalThis.__luma_pg_pool) return globalThis.__luma_pg_pool;

  const { connectionString, ssl } = buildConnection();

  if (!connectionString) {
    console.warn("⚠️ DATABASE_URL belum terkonfigurasi!");
  }

  const pool = new Pool({
    connectionString,
    ssl,
    max: Number(process.env.PG_POOL_MAX || 5),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000
  });

  pool.on("error", (err) => {
    console.error("[Postgres pool error]:", err.message);
  });

  globalThis.__luma_pg_pool = pool;
  return pool;
}

export const pool = getPool();

export function query(text, params) {
  return pool.query(text, params);
}

export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
