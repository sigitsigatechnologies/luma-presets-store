/**
 * Definisi Paket Bundling LUMA PRESETS
 * Harga satuan preset: Rp 10.000
 */
export const BUNDLE_TIERS = {
  "bundle-3": {
    id: "bundle-3",
    code: "BUNDLE-03",
    name: "Paket Hemat 3 Preset",
    presetCount: 3,
    price: 25000,
    originalPrice: 30000,
    discountBadge: "HEMAT 17%",
    description: "Pilih bebas 3 preset favorit untuk mulai koleksi."
  },
  "bundle-5": {
    id: "bundle-5",
    code: "BUNDLE-05",
    name: "Paket Populer 5 Preset",
    presetCount: 5,
    price: 40000,
    originalPrice: 50000,
    discountBadge: "HEMAT 20%",
    popular: true,
    description: "Paling laris! Bebas pilih 5 preset untuk berbagai momen."
  },
  "bundle-10": {
    id: "bundle-10",
    code: "BUNDLE-10",
    name: "Paket Pro 10 Preset",
    presetCount: 10,
    price: 75000,
    originalPrice: 100000,
    discountBadge: "HEMAT 25%",
    description: "10 preset pilihan untuk variasi gaya foto lengkap."
  },
  "bundle-all": {
    id: "bundle-all",
    code: "BUNDLE-ALL",
    name: "All-Access Semua 72 Preset",
    presetCount: 72,
    price: 99000,
    originalPrice: 720000,
    discountBadge: "HEMAT 86%",
    bestValue: true,
    description: "Akses seluruh 72 preset LUMA + garansi update."
  }
};

export function getBundleTier(tierId) {
  return BUNDLE_TIERS[tierId] || null;
}
