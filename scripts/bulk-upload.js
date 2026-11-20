// Helper script for bulk upload products
// Usage: node scripts/bulk-upload.js <json-file-path>

const fs = require("fs");

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: node scripts/bulk-upload.js <json-file-path>");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const products = Array.isArray(data) ? data : data.products;

  if (!products || !Array.isArray(products)) {
    console.error("Invalid JSON format. Expected array of products or { products: [...] }");
    process.exit(1);
  }

  const API_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const token = process.env.ADMIN_TOKEN;

  if (!token) {
    console.error("Set ADMIN_TOKEN environment variable");
    process.exit(1);
  }

  console.log(`Uploading ${products.length} products to ${API_URL}/api/products/bulk`);

  const res = await fetch(`${API_URL}/api/products/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ products }),
  });

  const result = await res.json();

  if (!res.ok) {
    console.error("Upload failed:", result);
    process.exit(1);
  }

  console.log("Upload result:", JSON.stringify(result, null, 2));
}

main().catch(console.error);

</parameter>