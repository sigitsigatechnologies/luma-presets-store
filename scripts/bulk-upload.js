/**
 * CLI bulk upload produk (JSON, tanpa file preset).
 * Untuk upload beserta file preset, gunakan panel admin > Import CSV.
 *
 * Usage: node scripts/bulk-upload.js <json-file-path>
 */
import "dotenv/config";
import fs from "node:fs/promises";

async function login(apiUrl) {
  const username = process.env.ADMIN_USER || "admin";
  const password = process.env.ADMIN_PASS || "";

  const res = await fetch(`${apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.token) {
    throw new Error(data.error || "Login admin gagal. Periksa ADMIN_USER/ADMIN_PASS.");
  }
  return data.token;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: node scripts/bulk-upload.js <json-file-path>");
    process.exit(1);
  }

  const data = JSON.parse(await fs.readFile(filePath, "utf-8"));
  const products = Array.isArray(data) ? data : data.products;

  if (!Array.isArray(products)) {
    console.error("Format JSON tidak valid. Kirim array produk atau { products: [...] }.");
    process.exit(1);
  }

  const apiUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const token = await login(apiUrl);

  console.log(`Uploading ${products.length} produk ke ${apiUrl}/api/products/bulk`);

  const res = await fetch(`${apiUrl}/api/products/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ products })
  });

  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Upload gagal:", result);
    process.exit(1);
  }

  console.log("Upload result:", JSON.stringify(result.summary || result, null, 2));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
