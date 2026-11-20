/**
 * Normalisasi katalog:
 * - Hapus produk sampah macOS (__MACOSX / ._file).
 * - Klasifikasi ulang preset baru LP01-LP40 berdasarkan nama.
 * - Samakan harga semua preset satuan menjadi Rp 10.000.
 * - Pasang gambar contoh yang sesuai kategori/nama preset.
 *
 * Jalankan: node scripts/update-catalog.js
 */
import "dotenv/config";
import { pool, withTransaction } from "../lib/config/database.js";
import { buildPresetImage, guessCategory } from "../lib/utils/product-meta.js";

const NEW_PRESET_PATTERN = /^LP(0[1-9]|[1-3][0-9]|40)$/;

async function main() {
  const junk = await pool.query(
    "DELETE FROM products WHERE left(code, 2) = '._' OR code = '.DS_Store' RETURNING code"
  );
  console.log(`🗑️  Produk sampah dihapus: ${junk.rowCount}`);

  const { rows } = await pool.query(
    "SELECT id, code, name, category FROM products WHERE category <> 'Bundle' ORDER BY code"
  );

  let updated = 0;
  await withTransaction(async (client) => {
    for (const product of rows) {
      const category = NEW_PRESET_PATTERN.test(product.code)
        ? guessCategory(product.name)
        : product.category || guessCategory(product.name);
      const image = buildPresetImage(product.code, product.name, category);

      await client.query(
        "UPDATE products SET category = $1, price = $2, image = $3 WHERE id = $4",
        [category, 10000, image, product.id]
      );
      updated += 1;
    }
  });

  console.log(`✅ ${updated} preset diperbarui (kategori, harga Rp 10.000, gambar).`);
  await pool.end();
}

main().catch(async (err) => {
  console.error("❌ Gagal update katalog:", err.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
