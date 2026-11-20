import "dotenv/config";
import { pool, withTransaction } from "../lib/config/database.js";
import { buildPresetImage, guessCategory } from "../lib/utils/product-meta.js";

const CATEGORY_QUERIES = {
  Aesthetic: ["aesthetic film photography", "soft pastel aesthetic", "warm minimal aesthetic"],
  Portrait: ["cinematic portrait photography", "moody portrait film", "natural light portrait"],
  Nature: ["moody forest photography", "golden hour landscape", "green nature film"],
  Travel: ["travel photography cinematic", "tropical beach travel", "desert adventure photo"],
  Urban: ["urban street photography", "city night neon", "architecture moody city"],
  Cinematic: ["cinematic teal orange", "moody cinematic portrait", "cinematic film still"],
  Film: ["35mm film photography", "vintage film grain", "kodak film look"],
  Vintage: ["vintage film photography", "retro 70s photo", "sepia vintage"],
  Moody: ["moody dark photography", "low key portrait", "dark cinematic"],
  HDR: ["hdr landscape photography", "high detail texture photo", "dramatic sky hdr"],
  Lifestyle: ["lifestyle photography warm", "cafe lifestyle photo", "summer lifestyle"],
  "B&W": ["black and white portrait", "monochrome street photography", "bw fine art photo"],
  General: ["aesthetic photography", "film photography", "editorial photo"]
};

const THEME_RULES = [
  {
    key: "wedding",
    label: "Wedding",
    pattern: /\b(wedding|pernikahan|akad|resepsi|nikah)\b/,
    queries: ["indonesian wedding photography", "cinematic wedding couple", "wedding ceremony aesthetic", "bridal portrait"]
  },
  {
    key: "prewedding",
    label: "Prewedding & Lamaran",
    pattern: /\b(prewed|pre-?wedding|engagement|lamaran|tunangan)\b/,
    queries: ["prewedding couple photography", "engagement couple photoshoot", "couple sunset silhouette", "engagement ring couple"]
  },
  {
    key: "birthday",
    label: "Ulang Tahun",
    pattern: /\b(ulang tahun|birthday|sweet seventeen|sweet 17)\b/,
    queries: ["birthday celebration aesthetic", "birthday party photography", "sweet 17 birthday portrait"]
  },
  {
    key: "baby",
    label: "Baby & Kids",
    pattern: /\b(newborn|baby|anak|kids|milestone)\b/,
    queries: ["newborn baby photography", "kids portrait photography", "baby milestone photoshoot"]
  },
  {
    key: "graduation",
    label: "Wisuda",
    pattern: /\b(wisuda|graduation)\b/,
    queries: ["graduation portrait photography", "graduation ceremony aesthetic", "graduate student portrait"]
  },
  {
    key: "concert",
    label: "Konser & Festival",
    pattern: /\b(konser|concert|festival|indie)\b/,
    queries: ["concert stage lights", "music festival crowd", "live concert photography"]
  },
  {
    key: "eid",
    label: "Lebaran & Keluarga",
    pattern: /\b(lebaran|eid|idul|silaturahmi)\b/,
    queries: ["eid celebration family", "muslim family gathering", "lebaran family portrait"]
  },
  {
    key: "corporate",
    label: "Corporate & Headshot",
    pattern: /\b(corporate|headshot|profesional|professional)\b/,
    queries: ["corporate headshot photography", "professional business portrait"]
  },
  {
    key: "bw",
    label: "Hitam Putih",
    pattern: /\b(hitam putih|black|grey|gray|b&w|monochrome)\b/,
    queries: ["black and white portrait", "monochrome street photography", "bw fine art photo"]
  },
  {
    key: "beach",
    label: "Pantai & Tropis",
    pattern: /\b(pantai|beach|tropis|tropical|sunset drone|beachy)\b/,
    queries: ["tropical beach photography", "beach sunset aesthetic", "aerial beach drone"]
  },
  {
    key: "cafe",
    label: "Kafe & Kuliner",
    pattern: /\b(kafe|cafe|kuliner|food|matcha)\b/,
    queries: ["cafe aesthetic photography", "food photography warm", "coffee shop aesthetic"]
  },
  {
    key: "nature",
    label: "Alam",
    pattern: /\b(savana|bukit|gunung|forest|woodland|flowers|sakura|sunset|daybreak|summer)\b/,
    queries: ["nature landscape photography", "golden hour landscape", "flowers bloom aesthetic"]
  },
  {
    key: "urban",
    label: "Urban & Kota",
    pattern: /\b(kota|urban|beton|city|hongkong|street)\b/,
    queries: ["urban street photography", "city night neon", "city architecture moody"]
  },
  {
    key: "portrait",
    label: "Portrait & Selfie",
    pattern: /\b(portrait|selfie|glow)\b/,
    queries: ["cinematic portrait photography", "natural light portrait", "selfie aesthetic"]
  },
  {
    key: "film",
    label: "Film & Vintage",
    pattern: /\b(film|vintage|fuji|35mm|sepia|retro|90an)\b/,
    queries: ["35mm film photography", "vintage film look", "retro film portrait"]
  },
  {
    key: "hdr",
    label: "HDR",
    pattern: /\b(hdr|textured)\b/,
    queries: ["hdr landscape photography", "dramatic sky photography"]
  },
  {
    key: "moody",
    label: "Moody & Neon",
    pattern: /\b(dark|moody|neon|gelap|extraction|duo tone|orange|teal)\b/,
    queries: ["moody cinematic photography", "neon night portrait", "teal orange cinematic"]
  }
];

function parseArgs(argv) {
  const args = { dryRun: false, plan: false, limit: Infinity, category: null, provider: null, page: 1, help: false };
  for (const arg of argv) {
    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--plan") args.plan = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg.startsWith("--limit=")) {
      const value = parseInt(arg.slice("--limit=".length), 10);
      if (Number.isFinite(value) && value > 0) args.limit = value;
    } else if (arg.startsWith("--page=")) {
      const value = parseInt(arg.slice("--page=".length), 10);
      if (Number.isFinite(value) && value > 0) args.page = value;
    } else if (arg.startsWith("--category=")) args.category = arg.slice("--category=".length).trim();
    else if (arg.startsWith("--provider=")) args.provider = arg.slice("--provider=".length).trim().toLowerCase();
  }
  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveProvider(preferred) {
  const unsplashKey = (process.env.UNSPLASH_ACCESS_KEY || "").trim();
  const pexelsKey = (process.env.PEXELS_API_KEY || "").trim();
  const pixabayKey = (process.env.PIXABAY_API_KEY || "").trim();

  if (preferred === "unsplash") {
    if (!unsplashKey) throw new Error("UNSPLASH_ACCESS_KEY belum diisi di .env");
    return { name: "unsplash", key: unsplashKey };
  }
  if (preferred === "pexels") {
    if (!pexelsKey) throw new Error("PEXELS_API_KEY belum diisi di .env");
    return { name: "pexels", key: pexelsKey };
  }
  if (preferred === "pixabay") {
    if (!pixabayKey) throw new Error("PIXABAY_API_KEY belum diisi di .env");
    return { name: "pixabay", key: pixabayKey };
  }
  if (preferred === "openverse") return { name: "openverse", key: "" };
  if (preferred === "curated") return { name: "curated", key: "" };
  if (preferred) throw new Error(`Provider tidak dikenal: ${preferred}`);

  if (unsplashKey) return { name: "unsplash", key: unsplashKey };
  if (pexelsKey) return { name: "pexels", key: pexelsKey };
  if (pixabayKey) return { name: "pixabay", key: pixabayKey };
  return { name: "missing", key: "" };
}

async function searchUnsplash(query, count, key, page) {
  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(Math.min(Math.max(count, 1), 30)));
  url.searchParams.set("page", String(page));
  url.searchParams.set("orientation", "portrait");
  url.searchParams.set("content_filter", "high");

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" }
  });
  if (!res.ok) throw new Error(`Unsplash HTTP ${res.status}`);
  const data = await res.json();
  return (data.results || [])
    .map((item) => item.urls?.regular || item.urls?.full)
    .filter(Boolean);
}

async function searchPexels(query, count, key, page) {
  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(Math.min(Math.max(count, 1), 80)));
  url.searchParams.set("page", String(page));
  url.searchParams.set("orientation", "portrait");

  const res = await fetch(url, { headers: { Authorization: key } });
  if (!res.ok) throw new Error(`Pexels HTTP ${res.status}`);
  const data = await res.json();
  return (data.photos || [])
    .map((item) => item.src?.portrait || item.src?.large2x || item.src?.large || item.src?.original)
    .filter(Boolean);
}

async function searchPixabay(query, count, key, page) {
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", key);
  url.searchParams.set("q", query);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("orientation", "vertical");
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("per_page", String(Math.min(Math.max(count, 3), 200)));
  url.searchParams.set("page", String(page));

  const res = await fetch(url, {
    headers: { "User-Agent": "luma-presets-store/1.0 (theme image fetcher)" }
  });
  if (!res.ok) throw new Error(`Pixabay HTTP ${res.status}`);
  const data = await res.json();
  return (data.hits || [])
    .map((item) => item.largeImageURL || item.webformatURL || item.imageURL)
    .filter(Boolean);
}

async function searchOpenverse(query, count, page) {
  const url = new URL("https://api.openverse.org/v1/images/");
  url.searchParams.set("q", query);
  url.searchParams.set("page_size", String(Math.min(Math.max(count, 1), 20)));
  url.searchParams.set("page", String(page));
  url.searchParams.set("license", "cc0,pdm,by");
  url.searchParams.set("extension", "jpg");
  url.searchParams.set("size", "large");
  url.searchParams.set("mature", "false");

  const res = await fetch(url, {
    headers: { "User-Agent": "luma-presets-store/1.0 (theme image fetcher)" }
  });
  if (!res.ok) throw new Error(`Openverse HTTP ${res.status}`);
  const data = await res.json();
  return (data.results || []).map((item) => item.url).filter(Boolean);
}

function createSearch(provider, page) {
  if (provider.name === "unsplash") {
    return (query, count) => searchUnsplash(query, count, provider.key, page);
  }
  if (provider.name === "pexels") {
    return (query, count) => searchPexels(query, count, provider.key, page);
  }
  if (provider.name === "pixabay") {
    return (query, count) => searchPixabay(query, count, provider.key, page);
  }
  return (query, count) => searchOpenverse(query, count, page);
}

function themeFor(product) {
  const text = String(product.name || "").toLowerCase();
  for (const rule of THEME_RULES) {
    if (rule.pattern.test(text)) return rule;
  }
  const category = product.category || guessCategory(product.name);
  return {
    key: `cat:${category}`,
    label: category,
    queries: CATEGORY_QUERIES[category] || CATEGORY_QUERIES.General
  };
}

async function collectThemePool(search, provider, queries, perQuery) {
  const seen = new Set();
  const images = [];
  const selectedQueries = provider.name === "unsplash" ? queries.slice(0, 2) : queries;

  for (const query of selectedQueries) {
    try {
      const urls = await search(query, perQuery);
      for (const url of urls) {
        if (!seen.has(url)) {
          seen.add(url);
          images.push(url);
        }
      }
    } catch (err) {
      console.warn(`  ⚠️  "${query}" gagal: ${err.message}`);
    }
    await sleep(provider.name === "openverse" ? 1500 : 400);
  }

  return images;
}

function printHelp() {
  console.log(`Cara pakai: node scripts/fetch-theme-images.js [opsi]

Opsi:
  --provider=unsplash|pexels|pixabay|openverse|curated  Pilih sumber gambar (default: otomatis)
  --category=Wedding                      Batasi ke satu kategori produk
  --limit=10                              Proses maksimal N produk
  --page=2                                Ambil halaman hasil ke-N (biar gambar beda)
  --dry-run                               Tampilkan rencana tanpa update database
  --plan                                  Tampilkan tema & query tanpa memanggil API

Provider otomatis: UNSPLASH_ACCESS_KEY → PEXELS_API_KEY → PIXABAY_API_KEY → error (butuh key).
Tanpa key sementara bisa: --provider=curated (gambar Unsplash kurasi).
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const provider = resolveProvider(args.provider);
  if (provider.name === "missing") {
    console.error("❌ Belum ada API key gambar.");
    console.error("   Isi salah satu di .env: UNSPLASH_ACCESS_KEY, PEXELS_API_KEY, atau PIXABAY_API_KEY.");
    console.error("   Tanpa key sementara bisa: npm run images -- --provider=curated");
    process.exitCode = 1;
    return;
  }

  const search = provider.name === "curated" ? null : createSearch(provider, args.page);

  const { rows } = await pool.query(
    "SELECT id, code, name, category, image FROM products WHERE category <> 'Bundle' ORDER BY id"
  );

  let products = rows;
  if (args.category) {
    const wanted = args.category.toLowerCase();
    products = products.filter(
      (p) => (p.category || "").toLowerCase() === wanted || String(p.name || "").toLowerCase().includes(wanted)
    );
  }
  if (Number.isFinite(args.limit)) products = products.slice(0, args.limit);

  if (!products.length) {
    console.log("Tidak ada produk yang cocok dengan filter.");
    return;
  }

  const groups = new Map();
  for (const product of products) {
    const theme = themeFor(product);
    if (!groups.has(theme.key)) {
      groups.set(theme.key, { label: theme.label, queries: theme.queries, items: [] });
    }
    groups.get(theme.key).items.push(product);
  }

  console.log(`🖼️  Provider: ${provider.name} | Produk: ${products.length} | Tema: ${groups.size}`);

  if (args.plan) {
    let totalRequests = 0;
    for (const [, group] of groups) {
      const queries = provider.name === "unsplash" ? group.queries.slice(0, 2) : group.queries;
      totalRequests += queries.length;
      console.log(`\n📂 ${group.label} (${group.items.length})`);
      queries.forEach((query) => console.log(`   - ${query}`));
    }
    console.log(`\n📊 Total request API: ${totalRequests}`);
    return;
  }

  const updates = [];
  for (const [, group] of groups) {
    console.log(`\n📂 ${group.label} (${group.items.length} produk)`);

    if (provider.name === "curated") {
      group.items.forEach((item) => {
        const category = item.category || guessCategory(item.name);
        const image = buildPresetImage(item.code, item.name, category);
        updates.push({ id: item.id, code: item.code, image });
        if (args.dryRun) console.log(`  • ${item.code} ${item.name} → ${image}`);
      });
      continue;
    }

    const imagePool = await collectThemePool(search, provider, group.queries, Math.max(15, group.items.length * 2));
    if (!imagePool.length) {
      console.warn("  ⚠️  Tidak ada gambar ditemukan, gambar lama dipertahankan.");
      continue;
    }

    group.items.forEach((item, index) => {
      const image = imagePool[index % imagePool.length];
      updates.push({ id: item.id, code: item.code, image });
      if (args.dryRun) console.log(`  • ${item.code} ${item.name} → ${image}`);
    });
  }

  if (!updates.length) {
    console.log("\nTidak ada gambar baru untuk disimpan.");
    return;
  }

  if (args.dryRun) {
    console.log(`\n🔍 Dry-run: ${updates.length} gambar siap dipasang (database tidak diubah).`);
    return;
  }

  await withTransaction(async (client) => {
    for (const update of updates) {
      await client.query("UPDATE products SET image = $1 WHERE id = $2", [update.image, update.id]);
    }
  });

  console.log(`\n✅ ${updates.length} gambar tema berhasil dipasang ke database.`);
}

main()
  .catch((err) => {
    console.error("❌ Gagal mengambil gambar tema:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end().catch(() => {});
  });
