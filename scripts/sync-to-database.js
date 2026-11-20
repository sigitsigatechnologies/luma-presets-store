/**
 * Sync Seed Presets dengan file Base64 ZIP ke database PostgreSQL (Neon)
 * Jalankan: node scripts/sync-to-database.js
 */
import "dotenv/config";
import { seedProducts } from "../lib/seed-data.js";
import { BUNDLE_TIERS } from "../lib/config/bundles.js";
import { createZip } from "../lib/utils/zip.js";
import { pool, withTransaction } from "../lib/config/database.js";
import crypto from "node:crypto";

function generateXmpContent(code, name, category) {
  const uuid = crypto.randomUUID().toUpperCase();
  return `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 7.0-c000 1.000000, 0000/00/00-00:00:00">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"
    crs:PresetType="Normal"
    crs:UUID="${uuid}"
    crs:SupportsAmount="True"
    crs:SupportsColor="True"
    crs:Copyright="LUMA Presets (c) 2026"
    crs:Version="16.0"
    crs:Treatment="${category === 'B&W' ? 'BlackAndWhite' : 'Color'}">
   <crs:Name>
    <rdf:Alt><rdf:li xml:lang="x-default">LUMA ${code} - ${name}</rdf:li></rdf:Alt>
   </crs:Name>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

function generateReadmeText(code, name, category) {
  return `========================================================
✨ LUMA PRESETS — LIGHTROOM MOBILE & DESKTOP
Preset: LUMA ${code} - ${name} (${category})
Lisensi: Personal & Commercial Use (Garansi Seumur Hidup)
Panduan: Import file .xmp ke Adobe Lightroom Mobile / Desktop.
Web: https://lumapresets.com
========================================================`;
}

async function upsertProducts(client, rows) {
  for (const row of rows) {
    await client.query(
      `INSERT INTO products
         (id, code, name, subtitle, category, price, status, available, description, image, file)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         code = EXCLUDED.code,
         name = EXCLUDED.name,
         subtitle = EXCLUDED.subtitle,
         category = EXCLUDED.category,
         price = EXCLUDED.price,
         status = EXCLUDED.status,
         available = EXCLUDED.available,
         description = EXCLUDED.description,
         image = EXCLUDED.image,
         file = EXCLUDED.file`,
      [
        row.id,
        row.code,
        row.name,
        row.subtitle,
        row.category,
        row.price,
        row.status,
        row.available,
        row.description,
        row.image,
        row.file
      ]
    );
  }
}

async function main() {
  console.log("⚡ Menghubungkan ke PostgreSQL (Neon)...");

  const { rows: existingRows } = await pool.query("SELECT id, file FROM products");
  const fileMap = new Map();
  existingRows.forEach((r) => {
    if (r.file && r.file.startsWith("data:")) fileMap.set(r.id, r.file);
  });

  console.log(`📦 Menyiapkan ${seedProducts.length} preset dengan binary Base64 ZIP...`);
  const prodRows = seedProducts.map((p) => {
    let base64Zip = fileMap.get(p.id);
    if (!base64Zip) {
      const xmp = generateXmpContent(p.code, p.name, p.category);
      const readme = generateReadmeText(p.code, p.name, p.category);
      const zip = createZip([
        { filename: `${p.code} ${p.name}.xmp`, content: Buffer.from(xmp, "utf-8") },
        { filename: "PANDUAN_CARA_INSTALL.txt", content: Buffer.from(readme, "utf-8") }
      ]);
      base64Zip = `data:application/zip;base64,${zip.toString("base64")}`;
    }

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      subtitle: p.subtitle || "",
      category: p.category || "General",
      price: p.price || 0,
      status: p.status || "AVAILABLE",
      available: p.available !== false && p.available !== 0,
      description: p.description || "",
      image: p.image || "",
      file: base64Zip
    };
  });

  const bundleRows = Object.values(BUNDLE_TIERS).map((b) => ({
    id: b.id,
    code: b.code,
    name: b.name,
    subtitle: b.description || "Paket Bundling",
    category: "Bundle",
    price: b.price,
    status: "AVAILABLE",
    available: true,
    description: b.description || "",
    image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=900&q=80",
    file: ""
  }));

  await withTransaction(async (client) => {
    await upsertProducts(client, prodRows);
    await upsertProducts(client, bundleRows);
  });

  console.log(`   ✅ Berhasil sync ${prodRows.length} preset + ${bundleRows.length} bundle tier.`);
  console.log("\n🎉 SELURUH DATA & BINARY BASE64 BERHASIL TERSIMPAN DI DATABASE NEON!");
  await pool.end();
}

main().catch(async (err) => {
  console.error("❌ Sync gagal:", err.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
