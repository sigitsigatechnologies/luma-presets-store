/**
 * Definisi Paket Bundling LUMA PRESETS
 */
export const BUNDLE_TIERS = {
  "bundle-3": {
    id: "bundle-3",
    code: "BUNDLE-03",
    name: "Paket Hemat 3 Preset Pilihan",
    presetCount: 3,
    price: 49000,
    originalPrice: 87000,
    discountBadge: "HEMAT 44%",
    description: "Pilih bebas 3 preset favorit Anda dengan harga hemat."
  },
  "bundle-5": {
    id: "bundle-5",
    code: "BUNDLE-05",
    name: "Paket Populer 5 Preset Pilihan",
    presetCount: 5,
    price: 79000,
    originalPrice: 145000,
    discountBadge: "HEMAT 46%",
    popular: true,
    description: "Paling laris! Bebas pilih 5 preset tone terbaik untuk berbagai momen."
  },
  "bundle-10": {
    id: "bundle-10",
    code: "BUNDLE-10",
    name: "Paket Pro 10 Preset Pilihan",
    presetCount: 10,
    price: 119000,
    originalPrice: 290000,
    discountBadge: "HEMAT 59%",
    description: "Koleksi 10 preset pilihan untuk variasi gaya foto lengkap."
  },
  "bundle-all": {
    id: "bundle-all",
    code: "BUNDLE-ALL",
    name: "Ultimate All-Access (Semua 76 Preset)",
    presetCount: 76,
    price: 149000,
    originalPrice: 2088000,
    discountBadge: "HEMAT 93%",
    bestValue: true,
    description: "Akses seluruh 76 preset LUMA tanpa batas + garansi update."
  }
};

export function getBundleTier(tierId) {
  return BUNDLE_TIERS[tierId] || null;
}
