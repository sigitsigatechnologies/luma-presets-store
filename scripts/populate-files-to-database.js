/**
 * Populate semua preset Lightroom sebagai file Base64 ZIP ke PostgreSQL (Neon)
 * Jalankan: node scripts/populate-files-to-database.js
 */
import "dotenv/config";
import { seedProducts } from "../lib/seed-data.js";
import { createZip } from "../lib/utils/zip.js";
import { pool, query } from "../lib/config/database.js";
import crypto from "node:crypto";

function generateXmpContent(code, name, category) {
  const uuid = crypto.randomUUID().toUpperCase();

  let temp = "+5";
  let tint = "+3";
  let exposure = "+0.20";
  let contrast = "+15";
  let highlights = "-25";
  let shadows = "+35";
  let whites = "+10";
  let blacks = "-15";
  let texture = "+10";
  let clarity = "+8";
  let dehaze = "+5";
  let vibrance = "+15";
  let saturation = "+5";

  if (category === "Aesthetic") {
    temp = "+8"; tint = "+6"; exposure = "+0.35"; highlights = "-35"; shadows = "+45"; whites = "+15"; blacks = "+5"; vibrance = "+20"; saturation = "-5";
  } else if (category === "Cinematic") {
    temp = "-5"; tint = "+2"; exposure = "-0.10"; contrast = "+25"; highlights = "-45"; shadows = "+20"; blacks = "-25"; dehaze = "+12"; vibrance = "-10";
  } else if (category === "Film" || category === "Vintage") {
    temp = "+12"; tint = "+8"; exposure = "+0.15"; contrast = "-10"; highlights = "-20"; shadows = "+30"; blacks = "+18"; texture = "-5"; clarity = "-10"; vibrance = "+10"; saturation = "-10";
  } else if (category === "B&W") {
    contrast = "+35"; highlights = "-30"; shadows = "+40"; whites = "+25"; blacks = "-30"; texture = "+20"; clarity = "+15"; vibrance = "-100"; saturation = "-100";
  } else if (category === "Nature" || category === "Travel") {
    temp = "+6"; tint = "-2"; exposure = "+0.25"; contrast = "+18"; highlights = "-40"; shadows = "+35"; whites = "+12"; blacks = "-10"; vibrance = "+25"; saturation = "+10";
  } else if (category === "HDR") {
    exposure = "+0.10"; contrast = "+30"; highlights = "-60"; shadows = "+60"; whites = "+15"; blacks = "-20"; texture = "+25"; clarity = "+20"; dehaze = "+15"; vibrance = "+30"; saturation = "+15";
  } else if (category === "Portrait") {
    temp = "+7"; tint = "+5"; exposure = "+0.30"; contrast = "+8"; highlights = "-25"; shadows = "+30"; whites = "+10"; blacks = "-5"; texture = "-10"; clarity = "-5"; vibrance = "+15"; saturation = "0";
  }

  return `<?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 7.0-c000 1.000000, 0000/00/00-00:00:00">
 <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about=""
    xmlns:crs="http://ns.adobe.com/camera-raw-settings/1.0/"
    crs:PresetType="Normal"
    crs:Cluster=""
    crs:UUID="${uuid}"
    crs:SupportsAmount="True"
    crs:SupportsColor="True"
    crs:SupportsMonochrome="${category === 'B&W' ? 'True' : 'False'}"
    crs:Copyright="LUMA Presets (c) 2026"
    crs:Version="16.0"
    crs:ProcessVersion="15.4"
    crs:Treatment="${category === 'B&W' ? 'BlackAndWhite' : 'Color'}"
    crs:WhiteBalance="Custom"
    crs:Temperature="${temp}"
    crs:Tint="${tint}"
    crs:Exposure2012="${exposure}"
    crs:Contrast2012="${contrast}"
    crs:Highlights2012="${highlights}"
    crs:Shadows2012="${shadows}"
    crs:Whites2012="${whites}"
    crs:Blacks2012="${blacks}"
    crs:Texture="${texture}"
    crs:Clarity2012="${clarity}"
    crs:Dehaze="${dehaze}"
    crs:Vibrance="${vibrance}"
    crs:Saturation="${saturation}">
   <crs:Name>
    <rdf:Alt>
     <rdf:li xml:lang="x-default">LUMA ${code} - ${name}</rdf:li>
    </rdf:Alt>
   </crs:Name>
  </rdf:Description>
 </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}

function generateReadmeText(code, name, category) {
  return `========================================================
✨ LUMA PRESETS — LIGHTROOM MOBILE & DESKTOP PRESET
========================================================
Preset: LUMA ${code} - ${name}
Kategori: ${category}
Lisensi: Personal & Commercial Use (Garansi Seumur Hidup)

CARA IMPORT DI ADOBE LIGHTROOM MOBILE (iOS & Android):
1. Ekstrak file .zip ini di HP Anda.
2. Buka Adobe Lightroom Mobile.
3. Buka foto yang ingin Anda beri sentuhan warna.
4. Pilih menu "Presets" di bagian bawah.
5. Tap ikon titik tiga (...) di pojok kanan atas, pilih "Import Presets".
6. Pilih file "${code} ${name}.xmp".
7. Selesai! Preset siap digunakan dengan 1-klik.

TIPS PENGGUNAAN:
Setiap kamera dan pencahayaan foto berbeda.
Setelah mengaplikasikan preset, cukup sesuaikan slider:
- Exposure (Pencahayaan) jika foto terlalu terang/gelap.
- Temp (Suhu Warna) jika ingin hasil lebih hangat/dingin.

Terima kasih telah memilih LUMA Presets!
Bantuan Customer Service via WhatsApp: https://lumapresets.com
=======================================================
`;
}

async function main() {
  console.log("⚡ Menghubungkan ke PostgreSQL (Neon)...");
  console.log(`📦 Membuat binary ZIP XMP & menyimpan Base64 untuk ${seedProducts.length} preset...`);

  let count = 0;
  for (const p of seedProducts) {
    const xmpContent = generateXmpContent(p.code, p.name, p.category);
    const readmeContent = generateReadmeText(p.code, p.name, p.category);

    const zipBuffer = createZip([
      { filename: `${p.code} ${p.name}.xmp`, content: Buffer.from(xmpContent, "utf-8") },
      { filename: "PANDUAN_CARA_INSTALL.txt", content: Buffer.from(readmeContent, "utf-8") }
    ]);

    const base64DataUri = `data:application/zip;base64,${zipBuffer.toString("base64")}`;

    try {
      await query("UPDATE products SET file = $1 WHERE id = $2", [base64DataUri, p.id]);
      count++;
      if (count % 10 === 0 || count === seedProducts.length) {
        console.log(`   ✅ Tersimpan di database: ${count}/${seedProducts.length} preset`);
      }
    } catch (err) {
      console.error(`   ❌ Gagal update file ${p.id} (${p.name}):`, err.message);
    }
  }

  console.log(`\n🎉 SELESAI! ${count} preset kini memiliki binary ZIP tersimpan sebagai Base64 di database Neon.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error("❌ Populate gagal:", err.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
