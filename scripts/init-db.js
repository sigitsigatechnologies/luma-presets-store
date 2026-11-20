/**
 * Inisialisasi schema PostgreSQL (Neon)
 * Jalankan: node scripts/init-db.js
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../lib/config/database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const schemaPath = path.join(__dirname, "..", "database-schema.sql");
  const sql = await fs.readFile(schemaPath, "utf-8");

  console.log("⚡ Membuat schema di database Neon...");
  await pool.query(sql);
  console.log("✅ Schema berhasil dibuat/diperbarui.");
  await pool.end();
}

main().catch(async (err) => {
  console.error("❌ Gagal inisialisasi database:", err.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
