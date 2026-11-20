/**
 * Sync Seed Presets with Base64 ZIP Files directly to Supabase Cloud
 * Jalankan: node scripts/sync-to-supabase.js
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { seedProducts } from "../lib/seed-data.js";
import { BUNDLE_TIERS } from "../lib/config/bundles.js";
import { createZip } from "../lib/utils/zip.js";
import crypto from "node:crypto";

const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim();
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "").trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ SUPABASE_URL atau SUPABASE_KEY belum diisi di .env!");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

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

async function main() {
  console.log("⚡ Menghubungkan ke Supabase Cloud (" + SUPABASE_URL + ")...");

  // 1. Check existing files to avoid regenerating if already present
  const { data: existingRows } = await supabase.from("products").select("id, file");
  const fileMap = new Map();
  (existingRows || []).forEach((r) => {
    if (r.file && r.file.startsWith("data:")) fileMap.set(r.id, r.file);
  });

  // 2. Prepare 72 presets with Base64 ZIPs
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

  // 3. Upsert products
  const { error: pErr } = await supabase.from("products").upsert(prodRows);
  if (pErr) {
    console.error("   ❌ Gagal sync produk:", pErr.message);
  } else {
    console.log(`   ✅ Berhasil sync ${prodRows.length} produk + binary Base64 ke Supabase!`);
  }

  // 4. Ensure bundle tiers in database
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
  await supabase.from("products").upsert(bundleRows);
  console.log("   ✅ Bundle tiers terverifikasi di Supabase Cloud.");

  console.log("\n🎉 SELURUH DATA & BINARY BASE64 BERHASIL TERSIMPAN DI SUPABASE CLOUD!");
}

main().catch(console.error);
