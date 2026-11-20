"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  ArrowsRightLeftIcon,
  SparklesIcon,
  FilmIcon,
  UserIcon,
  SunIcon,
  BuildingOffice2Icon,
  BoltIcon,
  PaperAirplaneIcon,
  HeartIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  MoonIcon,
  SwatchIcon,
  Squares2X2Icon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  MinusIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import styles from "./page.module.css";
import CheckoutModal from "./components/CheckoutModal";
import DownloadPortal from "./components/DownloadPortal";

const API = "";
const PRODUCTS_PER_PAGE = 12;

const CATEGORY_META = {
  Aesthetic: { icon: SparklesIcon, desc: "Tone lembut & pastel" },
  Cinematic: { icon: FilmIcon, desc: "Warna dramatis ala film" },
  Film: { icon: FilmIcon, desc: "Karakter analog vintage" },
  Portrait: { icon: UserIcon, desc: "Skin tone natural & glowing" },
  Nature: { icon: SunIcon, desc: "Hijau & langit yang kaya" },
  Urban: { icon: BuildingOffice2Icon, desc: "Moody & neon street" },
  HDR: { icon: BoltIcon, desc: "Detail tajam & kontras" },
  Travel: { icon: PaperAirplaneIcon, desc: "Cerah untuk liburan" },
  Lifestyle: { icon: HeartIcon, desc: "Warm & minimalis" },
  Vintage: { icon: ClockIcon, desc: "Nostalgia 70-an & 90-an" },
  "B&W": { icon: AdjustmentsHorizontalIcon, desc: "Monokrom klasik" },
  Moody: { icon: MoonIcon, desc: "Gelap & dramatis" },
  General: { icon: SwatchIcon, desc: "Serbaguna" },
};

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=900&q=80";

const FAQ_ITEMS = [
  {
    q: "Perlu langganan Lightroom berbayar?",
    a: "Tidak. Preset LUMA bisa dipakai di Adobe Lightroom Mobile versi gratis (iOS & Android), juga Lightroom Desktop/Classic.",
  },
  {
    q: "Format file apa yang saya dapat?",
    a: "Setiap preset tersedia dalam format .XMP (Lightroom Desktop/Classic) dan siap diimport ke Lightroom Mobile.",
  },
  {
    q: "Bagaimana cara menerima file?",
    a: "Setelah pembayaran berhasil, kode akses dan link unduhan otomatis dikirim ke WhatsApp kamu dalam hitungan detik.",
  },
  {
    q: "Bisa unduh ulang kalau ganti HP?",
    a: "Bisa. Akses berlaku seumur hidup. Cukup buka Portal Unduh dan masukkan kode akses kamu kapan saja.",
  },
];

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

function toBeforeImage(url) {
  if (!url || !url.startsWith("http")) return url;
  try {
    const parsed = new URL(url);
    ["sat", "con", "exp", "bri", "hue", "monochrome"].forEach((key) => parsed.searchParams.delete(key));
    parsed.searchParams.set("sat", "-80");
    parsed.searchParams.set("con", "-15");
    parsed.searchParams.set("exp", "-6");
    parsed.searchParams.set("bri", "4");
    return parsed.toString();
  } catch {
    return url;
  }
}

function CatIcon({ name, className = "h-4 w-4" }) {
  const Icon = CATEGORY_META[name]?.icon || Squares2X2Icon;
  return <Icon className={className} aria-hidden="true" />;
}

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [bundleCheckout, setBundleCheckout] = useState(null);
  const [showDownload, setShowDownload] = useState(false);
  const [bundleTiers, setBundleTiers] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const [openFaq, setOpenFaq] = useState(null);

  const [sliderPos, setSliderPos] = useState(55);
  const sliderRef = useRef(null);
  const isDraggingRef = useRef(false);
  const sliderRectRef = useRef(null);
  const sliderRafRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    loadProducts();
    loadBundleTiers();

    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "true" || params.get("order_id")) {
      const orderId = params.get("orderId") || params.get("order_id");
      if (orderId) {
        router.replace(`/order?orderId=${encodeURIComponent(orderId)}`);
        return;
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [router]);

  useEffect(() => {
    const stopDrag = () => {
      isDraggingRef.current = false;
      sliderRectRef.current = null;
      if (sliderRafRef.current) cancelAnimationFrame(sliderRafRef.current);
      sliderRafRef.current = null;
    };
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchend", stopDrag);
    window.addEventListener("touchcancel", stopDrag);
    return () => {
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchend", stopDrag);
      window.removeEventListener("touchcancel", stopDrag);
      if (sliderRafRef.current) cancelAnimationFrame(sliderRafRef.current);
    };
  }, []);

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API}/api/products`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBundleTiers = async () => {
    try {
      const res = await fetch(`${API}/api/products/bundles/tiers`);
      const data = await res.json();
      setBundleTiers(Object.values(data));
    } catch (_) {}
  };

  const availableProducts = useMemo(
    () => products.filter((p) => (p.available || p.status === "AVAILABLE") && p.category !== "Bundle"),
    [products]
  );

  const categoryStats = useMemo(() => {
    const counts = {};
    availableProducts.forEach((p) => {
      const category = (p.category || "General").trim();
      counts[category] = (counts[category] || 0) + 1;
    });
    return counts;
  }, [availableProducts]);

  const categories = useMemo(() => ["Semua", ...Object.keys(categoryStats)], [categoryStats]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return availableProducts.filter((p) => {
      const matchCategory =
        selectedCategory === "Semua" ||
        (p.category || "").toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(query)) ||
        (p.code && p.code.toLowerCase().includes(query));
      return matchCategory && matchSearch;
    });
  }, [availableProducts, selectedCategory, searchQuery]);

  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [selectedCategory, searchQuery]);

  const featuredProduct =
    availableProducts.find((p) => p.code === "LP05") ||
    availableProducts.find((p) => p.image) ||
    availableProducts[0];

  const heroAfter = featuredProduct?.image || FALLBACK_IMAGE;
  const heroBefore = toBeforeImage(heroAfter);

  const startSliderDrag = (clientX) => {
    if (!sliderRef.current) return;
    isDraggingRef.current = true;
    sliderRectRef.current = sliderRef.current.getBoundingClientRect();
    updateSliderPos(clientX);
  };

  const updateSliderPos = (clientX) => {
    const rect = sliderRectRef.current || (sliderRef.current ? sliderRef.current.getBoundingClientRect() : null);
    if (!rect) return;
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    if (sliderRafRef.current) cancelAnimationFrame(sliderRafRef.current);
    sliderRafRef.current = requestAnimationFrame(() => {
      setSliderPos(percent);
      sliderRafRef.current = null;
    });
  };

  const openDownload = () => {
    setShowDownload(true);
  };

  return (
    <div
      className={styles.page}
      onMouseMove={(e) => {
        if (isDraggingRef.current) updateSliderPos(e.clientX);
      }}
    >
      <div className={styles.promoBar}>
        Semua preset <strong>Rp 10.000</strong> · Garansi akses seumur hidup · Kirim otomatis ke WhatsApp
      </div>

      <header className={styles.nav}>
        <div className="container">
          <div className={styles.navInner}>
            <button
              className={styles.logo}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                setMobileMenuOpen(false);
              }}
            >
              LUMA <span className={styles.logoBadge}>Presets</span>
            </button>

            <nav className={styles.navLinks}>
              <button className={styles.navLink} onClick={() => scrollToId("products")}>
                Preset
              </button>
              <button className={styles.navLink} onClick={() => scrollToId("bundles")}>
                Paket Hemat
              </button>
              <button className={styles.navLink} onClick={() => router.push("/order")}>
                Cek Pesanan
              </button>
              <button className={styles.navCta} onClick={openDownload}>
                <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                Portal Unduh
              </button>
            </nav>

            <button
              type="button"
              className={styles.menuToggle}
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className={styles.mobileMenu}>
              <button
                className={styles.mobileMenuItem}
                onClick={() => {
                  scrollToId("products");
                  setMobileMenuOpen(false);
                }}
              >
                Preset
              </button>
              <button
                className={styles.mobileMenuItem}
                onClick={() => {
                  scrollToId("bundles");
                  setMobileMenuOpen(false);
                }}
              >
                Paket Hemat
              </button>
              <button
                className={styles.mobileMenuItem}
                onClick={() => {
                  router.push("/order");
                  setMobileMenuOpen(false);
                }}
              >
                Cek Pesanan
              </button>
              <button
                className={`${styles.mobileMenuItem} ${styles.mobileMenuPrimary}`}
                onClick={() => {
                  openDownload();
                  setMobileMenuOpen(false);
                }}
              >
                <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
                Portal Unduh
              </button>
            </div>
          )}
        </div>
      </header>

      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <span className={styles.heroEyebrow}>Preset Lightroom Premium</span>
              <h1 className={styles.heroTitle}>
                Foto biasa jadi <span className={styles.heroHighlight}>sinematik</span> dalam 1 klik.
              </h1>
              <p className={styles.heroSub}>
                {availableProducts.length || 72} preset siap pakai untuk iPhone, Android, dan Desktop. Sekali bayar{" "}
                <span className={styles.priceHighlight}>Rp 10.000</span>, kode akses langsung dikirim ke WhatsApp.
              </p>
              <div className={styles.heroCta}>
                <button className="btn btn-primary btn-lg" onClick={() => scrollToId("products")}>
                  Pilih Preset
                </button>
                <button className="btn btn-outline btn-lg" onClick={() => scrollToId("bundles")}>
                  Lihat Paket Hemat
                </button>
              </div>
              <div className={styles.heroTrust}>
                <span className="inline-flex items-center gap-1.5">
                  <BoltIcon className="h-4 w-4" aria-hidden="true" /> 1-klik apply
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <DevicePhoneMobileIcon className="h-4 w-4" aria-hidden="true" /> iOS &amp; Android
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ComputerDesktopIcon className="h-4 w-4" aria-hidden="true" /> Mac &amp; Windows
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ArrowPathIcon className="h-4 w-4" aria-hidden="true" /> Akses seumur hidup
                </span>
              </div>
              <div className={styles.heroRating}>
                <span className="text-amber-500 tracking-wide">★★★★★</span>
                <span>4.9/5 dari 1.850+ kreator</span>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.showcaseCard}>
                <div className={styles.showcaseHeader}>
                  <span>Before / After</span>
                  <strong>{featuredProduct?.name || "LUMA Preset"}</strong>
                </div>
                <div
                  className={styles.sliderContainer}
                  ref={sliderRef}
                  onMouseDown={(e) => startSliderDrag(e.clientX)}
                  onTouchStart={(e) => {
                    if (e.touches[0]) startSliderDrag(e.touches[0].clientX);
                  }}
                  onTouchMove={(e) => {
                    if (isDraggingRef.current && e.touches[0]) updateSliderPos(e.touches[0].clientX);
                  }}
                >
                  <img
                    src={heroAfter}
                    alt="Sesudah preset"
                    className={styles.sliderImgAfter}
                    fetchPriority="high"
                    decoding="async"
                  />
                  <img
                    src={heroBefore}
                    alt="Sebelum preset"
                    className={styles.sliderImgBefore}
                    style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className={styles.sliderDivider} style={{ left: `${sliderPos}%` }}>
                    <div className={styles.sliderHandle}>
                      <ArrowsRightLeftIcon className="h-4 w-4" aria-hidden="true" />
                    </div>
                  </div>
                  <span className={styles.badgeBefore}>Sebelum</span>
                  <span className={styles.badgeAfter}>Sesudah</span>
                </div>
              </div>
              <div className={styles.priceFloat}>
                <strong>Rp 10.000</strong>
                <span>per preset</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.productsSection} id="products">
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="badge badge-accent">Koleksi Lengkap</span>
            <h2>Pilih Preset Favoritmu</h2>
            <p>Semua preset Rp 10.000 · {availableProducts.length} pilihan siap unduh</p>
          </div>

          <div className={styles.productsToolbar}>
            <div className={styles.searchBox}>
              <MagnifyingGlassIcon className={styles.searchIcon + " h-4 w-4"} aria-hidden="true" />
              <input
                className={styles.searchInput}
                placeholder="Cari preset (Creamy, Film, Sunset...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.categoryPills}>
              {categories.map((cat) => {
                const count = cat === "Semua" ? availableProducts.length : categoryStats[cat] || 0;
                return (
                  <button
                    key={cat}
                    className={`${styles.categoryPill} ${selectedCategory === cat ? styles.categoryPillActive : ""}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {cat === "Semua" ? (
                        <Squares2X2Icon className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <CatIcon name={cat} className="h-4 w-4" />
                      )}
                      {cat}
                    </span>
                    <span className={styles.categoryCount}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className={styles.grid}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className="skeleton" style={{ aspectRatio: "4/5", borderRadius: 14 }} />
                  <div className="skeleton" style={{ height: 16, width: "70%", marginTop: 14 }} />
                  <div className="skeleton" style={{ height: 13, width: "45%", marginTop: 8 }} />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={styles.empty}>
              <h3>Preset tidak ditemukan</h3>
              <p>Coba kata kunci lain atau reset filter kategori.</p>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("Semua");
                }}
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <>
              <div className={styles.grid}>
                {filteredProducts.slice(0, visibleCount).map((product) => (
                  <ProductCard key={product.id} product={product} onBuy={() => setCheckoutProduct(product)} />
                ))}
              </div>

              {visibleCount < filteredProducts.length && (
                <div className={styles.loadMore}>
                  <button
                    className="btn btn-outline"
                    onClick={() => setVisibleCount((count) => count + PRODUCTS_PER_PAGE)}
                  >
                    Tampilkan {Math.min(PRODUCTS_PER_PAGE, filteredProducts.length - visibleCount)} preset lagi
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {bundleTiers.length > 0 && (
        <section className={styles.bundleSection} id="bundles">
          <div className="container">
            <div className={styles.sectionHead}>
              <span className="badge badge-accent">Lebih Hemat</span>
              <h2>Paket Bundling</h2>
              <p>Pilih beberapa preset sekaligus, harganya lebih murah.</p>
            </div>

            <div className={styles.bundleGrid}>
              {bundleTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`${styles.bundleCard} ${tier.popular ? styles.bundlePopular : ""}`}
                >
                  {(tier.popular || tier.bestValue) && (
                    <span className={styles.bundleTag}>
                      {tier.bestValue ? "Nilai terbaik" : "Paling populer"}
                    </span>
                  )}
                  <h3>{tier.name}</h3>
                  <p>{tier.description}</p>
                  <div className={styles.bundlePriceRow}>
                    <span className={styles.bundlePrice}>Rp {Number(tier.price).toLocaleString("id-ID")}</span>
                    {tier.originalPrice > tier.price && (
                      <span className={styles.bundleOld}>Rp {Number(tier.originalPrice).toLocaleString("id-ID")}</span>
                    )}
                  </div>
                  <span className={styles.bundleDiscount}>{tier.discountBadge}</span>
                  <button className="btn btn-primary" onClick={() => setBundleCheckout(tier)}>
                    Pilih Paket
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className={styles.trustSection}>
        <div className="container">
          <div className={styles.trustGrid}>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>
                <ShieldCheckIcon className="h-5 w-5 text-gray-700" aria-hidden="true" />
              </span>
              <div>
                <strong>Pembayaran aman</strong>
                <p>QRIS, Virtual Account, dan kartu via Midtrans.</p>
              </div>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>
                <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-700" aria-hidden="true" />
              </span>
              <div>
                <strong>Kirim otomatis</strong>
                <p>Kode &amp; link unduhan langsung masuk WhatsApp.</p>
              </div>
            </div>
            <div className={styles.trustItem}>
              <span className={styles.trustIcon}>
                <ArrowPathIcon className="h-5 w-5 text-gray-700" aria-hidden="true" />
              </span>
              <div>
                <strong>Akses seumur hidup</strong>
                <p>Unduh ulang kapan saja lewat Portal Unduh.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.faqSection}>
        <div className="container">
          <div className={styles.sectionHead}>
            <span className="badge badge-accent">FAQ</span>
            <h2>Pertanyaan Umum</h2>
          </div>
          <div className={styles.faqList}>
            {FAQ_ITEMS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.q} className={styles.faqItem}>
                  <button className={styles.faqQuestion} onClick={() => setOpenFaq(isOpen ? null : index)}>
                    <span>{faq.q}</span>
                    <span className="text-gray-400">
                      {isOpen ? (
                        <MinusIcon className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <PlusIcon className="h-5 w-5" aria-hidden="true" />
                      )}
                    </span>
                  </button>
                  {isOpen && <div className={styles.faqAnswer}>{faq.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerInner}>
            <div>
              <strong>LUMA Presets</strong>
              <p>Preset Lightroom premium untuk foto yang lebih berkelas.</p>
            </div>
            <div className={styles.footerLinks}>
              <button onClick={() => scrollToId("products")}>Preset</button>
              <button onClick={() => scrollToId("bundles")}>Paket</button>
              <button onClick={() => router.push("/order")}>Cek Pesanan</button>
              <button onClick={openDownload}>Portal Unduh</button>
            </div>
          </div>
          <p className={styles.footerLegal}>
            © {new Date().getFullYear()} LUMA Presets. Adobe Lightroom® adalah merek dagang Adobe Inc.
          </p>
        </div>
      </footer>

      {checkoutProduct && (
        <CheckoutModal
          product={checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
          onSuccess={(order) => {
            setCheckoutProduct(null);
            setBundleCheckout(null);
            router.push(`/order?orderId=${encodeURIComponent(order.orderId || "")}`);
          }}
        />
      )}

      {bundleCheckout && (
        <CheckoutModal
          product={null}
          bundleTier={bundleCheckout}
          products={availableProducts}
          onClose={() => setBundleCheckout(null)}
          onSuccess={(order) => {
            setCheckoutProduct(null);
            setBundleCheckout(null);
            router.push(`/order?orderId=${encodeURIComponent(order.orderId || "")}`);
          }}
        />
      )}

      {showDownload && <DownloadPortal initialCode="" onClose={() => setShowDownload(false)} />}
    </div>
  );
}

function getProductPromo(product) {
  const seed = String(product.code || product.id || product.name || "");
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const bucket = hash % 10;
  if (bucket < 5) {
    const price = Number(product.price) || 0;
    const originalPrice = Math.max(Math.round((price * 1.5) / 1000) * 1000, price + 5000);
    return { type: "flash", label: "Promo", originalPrice };
  }
  if (bucket < 7) return { type: "bestseller", label: "Best Seller" };
  if (bucket < 9) return { type: "new", label: "Baru" };
  return null;
}

function ProductCard({ product, onBuy }) {
  const price = typeof product.price === "number" ? product.price : Number(product.price) || 0;
  const fallback = FALLBACK_IMAGE;
  const promo = getProductPromo(product);
  const discount =
    promo?.originalPrice > price ? Math.round((1 - price / promo.originalPrice) * 100) : 0;
  const promoClass =
    promo?.type === "bestseller"
      ? styles.promoBestseller
      : promo?.type === "new"
        ? styles.promoNew
        : styles.promoFlash;

  return (
    <article className={styles.productCard}>
      <button className={styles.productMedia} onClick={onBuy} aria-label={`Beli ${product.name}`}>
        <img
          src={product.image || fallback}
          alt={product.name}
          className={styles.productImg}
          loading="lazy"
          decoding="async"
          onError={(event) => {
            event.target.src = fallback;
          }}
        />
        <span className={styles.productCategory}>{product.category || "General"}</span>
        <span className={styles.productReady}>Siap unduh</span>
        {promo && (
          <span className={`${styles.productPromo} ${promoClass}`}>
            {promo.type === "flash" ? `Promo -${discount}%` : promo.label}
          </span>
        )}
      </button>
      <div className={styles.productBody}>
        <h3 className={styles.productName}>{product.name}</h3>
        <p className={styles.productSubtitle}>{product.subtitle || "Preset warna untuk berbagai suasana"}</p>
        {promo?.originalPrice > price && (
          <div className={styles.productSaving}>
            <span className={styles.productOld}>Rp {promo.originalPrice.toLocaleString("id-ID")}</span>
            <span className={styles.productSave}>
              Hemat Rp {(promo.originalPrice - price).toLocaleString("id-ID")}
            </span>
          </div>
        )}
        <div className={styles.productFooter}>
          <span className={styles.productPrice}>Rp {price.toLocaleString("id-ID")}</span>
          <button className="btn btn-primary btn-sm" onClick={onBuy}>
            Beli
          </button>
        </div>
      </div>
    </article>
  );
}
