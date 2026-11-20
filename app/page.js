"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import styles from "./page.module.css";
import CheckoutModal from "./components/CheckoutModal";
import DownloadPortal from "./components/DownloadPortal";
import BundleModal from "./components/BundleModal";
import PaymentSuccessModal from "./components/PaymentSuccessModal";

const API = "";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [bundleCheckout, setBundleCheckout] = useState(null);
  const [showDownload, setShowDownload] = useState(false);
  const [downloadInitialCode, setDownloadInitialCode] = useState("");
  const [showBundle, setShowBundle] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);
  const [bundleTiers, setBundleTiers] = useState([]);

  // Category and View Modes
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [viewMode, setViewMode] = useState("categorized"); // "categorized" | "grid"

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(null);

  // Before / After Slider State
  const [sliderPos, setSliderPos] = useState(50);
  const sliderRef = useRef(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    loadProducts();
    loadBundleTiers();

    // Check payment return from Midtrans redirect or URL params
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "true" || params.get("order_id")) {
      const orderId = params.get("orderId") || params.get("order_id");
      if (orderId) {
        fetch(`${API}/api/orders/${orderId}/check-status`)
          .then((r) => r.json())
          .then((data) => {
            if (data.status === "PAID") setSuccessOrder(data);
          })
          .catch(() => {});
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API}/api/products`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadBundleTiers = async () => {
    try {
      const res = await fetch(`${API}/api/products/bundles/tiers`);
      const data = await res.json();
      setBundleTiers(Object.values(data));
    } catch (e) {}
  };

  const handleCheckoutSuccess = (order) => {
    setCheckoutProduct(null);
    setBundleCheckout(null);
    setSuccessOrder(order);
  };

  const availableProducts = useMemo(() => {
    return products.filter((p) => (p.available || p.status === "AVAILABLE") && p.category !== "Bundle");
  }, [products]);

  // Categories list with counts
  const categoryStats = useMemo(() => {
    const counts = {};
    availableProducts.forEach((p) => {
      const cat = p.category ? p.category.trim() : "General";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [availableProducts]);

  const categories = useMemo(() => {
    return ["Semua", ...Object.keys(categoryStats)];
  }, [categoryStats]);

  // Grouped products by category
  const categorizedProducts = useMemo(() => {
    const groups = {};
    availableProducts.forEach((p) => {
      const cat = p.category ? p.category.trim() : "General";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [availableProducts]);

  // Filtered products for search or selected category
  const filteredProducts = useMemo(() => {
    return availableProducts.filter((p) => {
      const matchCat =
        selectedCategory === "Semua" ||
        (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(query)) ||
        (p.code && p.code.toLowerCase().includes(query));
      return matchCat && matchSearch;
    });
  }, [availableProducts, selectedCategory, searchQuery]);

  // Handle Before / After Slider interactions
  const handleSliderMove = (clientX) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  };

  const handleMouseDown = () => { isDraggingRef.current = true; };
  const handleMouseUp = () => { isDraggingRef.current = false; };
  const handleMouseMove = (e) => {
    if (isDraggingRef.current) handleSliderMove(e.clientX);
  };
  const handleTouchMove = (e) => {
    if (e.touches[0]) handleSliderMove(e.touches[0].clientX);
  };

  // Category Icon & Description Map
  const categoryMeta = {
    Aesthetic: { icon: "✨", desc: "Tone lembut, pastel, dan warm untuk feed Instagram aesthetic" },
    Cinematic: { icon: "🎬", desc: "Warna dramatis khas film bioskop dan movie poster" },
    Film: { icon: "🎞️", desc: "Karakter analog vintage 35mm grain dan retro tones" },
    Portrait: { icon: "👤", desc: "Optimalisasi warna kulit (skin tone) natural, bersih, dan glowing" },
    Nature: { icon: "🌿", desc: "Warna hijau daun kaya dan langit senja yang memukau" },
    Urban: { icon: "🏙️", desc: "Kontras moody dan neon tone untuk street photography" },
    HDR: { icon: "⚡", desc: "Detail tajam dengan dynamic range tinggi tanpa over-editing" },
    Travel: { icon: "✈️", desc: "Warna cerah ceria untuk pantai, liburan, dan petualangan" },
    Lifestyle: { icon: "☕", desc: "Tone cafe & warm minimalis untuk foto sehari-hari" },
    Vintage: { icon: "📻", desc: "Gaya nostalgia tahun 70-an & 90-an yang otentik" },
    General: { icon: "🎨", desc: "Tone serbaguna untuk segala jenis pencahayaan" }
  };

  return (
    <div
      className={styles.page}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      {/* Promo Announcement Banner */}
      <div className={styles.promoBar}>
        <span>🔥 FLASH SALE 2025:</span>
        <span>Dapatkan Diskon Hingga 93% untuk Paket Bundling 76+ Preset Lengkap!</span>
      </div>

      {/* Nav */}
      <header className={styles.nav}>
        <div className="container">
          <div className={styles.navInner}>
            <div className={styles.logo}>
              <span>LUMA</span>
              <span className={styles.logoBadge}>Lightroom Labs</span>
            </div>
            <nav className={styles.navLinks}>
              <button
                onClick={() => {
                  setDownloadInitialCode("");
                  setShowDownload(true);
                }}
                className={styles.navLink}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Portal Unduh
              </button>
              {/* <a href="/admin" className={styles.navLink}>
                Admin
              </a> */}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroEyebrow}>
            <span>✨ Koleksi Preset Lightroom Masterclass 2025</span>
          </div>
          <h1 className={styles.heroTitle}>
            Ubah Foto Biasa Jadi <br />
            <span className={styles.heroHighlight}>Karya Sinematik Berkelas.</span>
          </h1>
          <p className={styles.heroSub}>
            Tingkatkan estetika foto feed dan portfolio kamu dalam satu kali sentuh.
            Format presisi <strong>.DNG</strong> untuk iPhone & Android, serta <strong>.XMP</strong> untuk Lightroom Desktop Mac & Windows.
          </p>
          <div className={styles.heroCta}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
            >
              Lihat Koleksi ({availableProducts.length} Preset) ↓
            </button>
            <button
              className="btn btn-outline btn-lg"
              onClick={() => document.getElementById("bundles")?.scrollIntoView({ behavior: "smooth" })}
            >
              🔥 Paket Bundling Hemat (Up to 93% Off)
            </button>
          </div>

          <div className={styles.heroFeatures}>
            <div className={styles.heroFeatureItem}>
              <span>⚡</span> <span>1-Click Apply</span>
            </div>
            <div className={styles.heroFeatureItem}>
              <span>📱</span> <span>Lightroom iOS & Android</span>
            </div>
            <div className={styles.heroFeatureItem}>
              <span>💻</span> <span>Lightroom Classic Mac & Windows</span>
            </div>
            <div className={styles.heroFeatureItem}>
              <span>💬</span> <span>Kirim Instan ke WhatsApp</span>
            </div>
            <div className={styles.heroFeatureItem}>
              <span>♾️</span> <span>Akses Unduh Seumur Hidup</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Before & After Showcase */}
      <section className={styles.showcaseSection}>
        <div className="container">
          <div className={styles.showcaseCard}>
            <div className={styles.showcaseHeader}>
              <div>
                <span className="badge badge-accent" style={{ marginBottom: 4 }}>Live Transformation</span>
                <div className={styles.showcaseTitle}>Geser Slider untuk Melihat Perbedaannya</div>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-3)" }}>
                Preset: <strong>LUMA Cinematic Film Look</strong>
              </div>
            </div>

            <div
              className={styles.sliderContainer}
              ref={sliderRef}
              onMouseDown={handleMouseDown}
              onTouchMove={handleTouchMove}
            >
              {/* After Image (Full width background) */}
              <img
                src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=85"
                alt="After Preset"
                className={styles.sliderImgAfter}
              />

              {/* Before Image (Clipped by slider width) */}
              <div
                className={styles.sliderClipWrap}
                style={{ width: `${sliderPos}%` }}
              >
                <img
                  src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=40&sat=-60&con=-20"
                  alt="Before Preset"
                  className={styles.sliderImgBefore}
                  style={{ width: sliderRef.current?.clientWidth || "100%" }}
                />
              </div>

              {/* Slider Handle */}
              <div
                className={styles.sliderDivider}
                style={{ left: `${sliderPos}%` }}
              >
                <div className={styles.sliderHandle}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" transform="rotate(90 12 12)" />
                  </svg>
                </div>
              </div>

              <span className={styles.badgeBefore}>Sebelum (Flat RAW)</span>
              <span className={styles.badgeAfter}>Sesudah (LUMA Preset)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Products & Categorized Shelves */}
      <section className={styles.productsSection} id="products">
        <div className="container">
          <div className={styles.sectionHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <div>
              <span className="badge badge-accent" style={{ marginBottom: 6 }}>Koleksi Terlengkap</span>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: "#ffffff" }}>
                Pilih Preset Sesuai Gaya Fotomu
              </h2>
              <p className="text-muted" style={{ fontSize: 14, marginTop: 4 }}>
                Tersedia {availableProducts.length} preset premium siap unduh
              </p>
            </div>

            {/* View Mode Toggle: Per Kategori vs Semua */}
            <div style={{ display: "flex", gap: 6, background: "var(--bg-surface)", padding: 4, borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
              <button
                className={`btn btn-sm ${viewMode === "categorized" ? "btn-primary" : "btn-outline"}`}
                style={{ padding: "6px 12px" }}
                onClick={() => {
                  setViewMode("categorized");
                  setSelectedCategory("Semua");
                }}
              >
                📁 Per Kategori
              </button>
              <button
                className={`btn btn-sm ${viewMode === "grid" ? "btn-primary" : "btn-outline"}`}
                style={{ padding: "6px 12px" }}
                onClick={() => setViewMode("grid")}
              >
                ▦ Semua Grid
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className={styles.filterBar}>
            <div className={styles.searchBox}>
              <svg className={styles.searchIcon} width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className={styles.searchInput}
                placeholder="Cari preset favoritmu (e.g. Creamy, Film, Sunset, Tokyo)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Pills Navigation */}
            <div className={styles.categoryPills}>
              {categories.map((cat) => {
                const count = cat === "Semua" ? availableProducts.length : (categoryStats[cat] || 0);
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    className={`${styles.categoryPill} ${isActive ? styles.categoryPillActive : ""}`}
                    onClick={() => {
                      setSelectedCategory(cat);
                      if (cat !== "Semua") setViewMode("grid");
                    }}
                  >
                    <span>{categoryMeta[cat]?.icon || "📁"}</span>
                    <span>{cat}</span>
                    <span className={styles.categoryCountBadge}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className={styles.grid}>
              {[...Array(8)].map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className="skeleton" style={{ height: 180, borderRadius: 10 }} />
                  <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
                    <div className="skeleton" style={{ height: 16, width: "65%" }} />
                    <div className="skeleton" style={{ height: 13, width: "45%" }} />
                    <div className="skeleton" style={{ height: 38, marginTop: 8 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === "categorized" && selectedCategory === "Semua" && !searchQuery.trim() ? (
            /* BAGI PER KATEGORI (CATEGORY SHELVES) */
            <div>
              {Object.entries(categorizedProducts).map(([catName, prods]) => {
                const meta = categoryMeta[catName] || { icon: "📁", desc: "Koleksi preset pilihan" };
                return (
                  <div key={catName} className={styles.categoryShelf}>
                    <div className={styles.shelfHeader}>
                      <div className={styles.shelfTitleWrap}>
                        <span className={styles.shelfIcon}>{meta.icon}</span>
                        <div>
                          <div className={styles.shelfTitle}>
                            Kategori {catName} <span style={{ fontSize: 14, color: "var(--text-3)", fontWeight: 400 }}>({prods.length})</span>
                          </div>
                          <div className={styles.shelfDesc}>{meta.desc}</div>
                        </div>
                      </div>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          setSelectedCategory(catName);
                          setViewMode("grid");
                        }}
                      >
                        Lihat Semua {catName} →
                      </button>
                    </div>

                    <div className={styles.grid}>
                      {prods.slice(0, 4).map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onBuy={() => setCheckoutProduct(product)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={styles.empty}>
              <p style={{ fontSize: 16, fontWeight: 600, color: "var(--text)" }}>Tidak ada preset yang cocok</p>
              <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>
                Coba ubah kata kunci pencarian atau reset filter kategori.
              </p>
              <button
                className="btn btn-outline btn-sm"
                style={{ marginTop: 16 }}
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("Semua");
                }}
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className={styles.grid}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onBuy={() => setCheckoutProduct(product)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3 Steps Timeline */}
      <section className={styles.stepsSection}>
        <div className="container">
          <div className="text-center">
            <span className="badge badge-accent">Praktis & Instan</span>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#ffffff", marginTop: 8 }}>
              Hanya 3 Langkah Menuju Foto Estetik
            </h2>
            <p className="text-muted" style={{ maxWidth: 520, margin: "6px auto 0" }}>
              Tidak butuh skill editing rumit. Cukup 1 sentuhan dan fotomu langsung berkelas profesional.
            </p>
          </div>

          <div className={styles.stepsGrid}>
            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <div className={styles.stepTitle}>Pilih Preset & Checkout</div>
              <div className={styles.stepDesc}>
                Pilih preset favorit atau paket bundling hemat. Bayar aman via QRIS (BCA, Mandiri, GoPay, OVO, ShopeePay) dengan konfirmasi otomatis.
              </div>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <div className={styles.stepTitle}>Terima Kode di WhatsApp</div>
              <div className={styles.stepDesc}>
                Dalam 1 detik setelah terbayar, sistem otomatis mengirimkan kode akses dan tautan unduhan langsung ke WhatsApp kamu.
              </div>
            </div>

            <div className={styles.stepCard}>
              <div className={styles.stepNumber}>3</div>
              <div className={styles.stepTitle}>Import & Terapkan</div>
              <div className={styles.stepDesc}>
                Buka di Lightroom Mobile (iOS/Android) atau Lightroom Classic (PC/Mac). Klik Apply — foto kamu seketika berubah menakjubkan!
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bundle Pricing Section */}
      {bundleTiers.length > 0 && (
        <section className={styles.bundleSection} id="bundles">
          <div className="container">
            <div className="text-center" style={{ marginBottom: 36 }}>
              <span className="badge badge-accent">Penawaran Spesial</span>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: "#ffffff", marginTop: 8 }}>
                Paket Bundling Super Hemat
              </h2>
              <p className="text-muted" style={{ fontSize: 15, maxWidth: 540, margin: "6px auto 0" }}>
                Beli banyak jauh lebih hemat. Bebas pilih preset favorit kamu sendiri atau miliki seluruh katalog seumur hidup!
              </p>
            </div>

            <div className={styles.bundleGrid}>
              {bundleTiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`${styles.bundleTierCard} ${tier.popular ? styles.bundlePopular : ""} ${tier.bestValue ? styles.bundleBestValue : ""}`}
                >
                  {tier.popular && <span className={styles.bundleTag}>Paling Populer</span>}
                  {tier.bestValue && <span className={styles.bundleTagBest}>Nilai Terbaik</span>}
                  <div className={styles.bundleTierName}>{tier.name}</div>
                  <div className={styles.bundlePrice}>
                    <span className={styles.bundlePriceMain}>Rp {tier.price?.toLocaleString("id-ID")}</span>
                    <span className={styles.bundlePriceOld}>Rp {tier.originalPrice?.toLocaleString("id-ID")}</span>
                  </div>
                  <div className={styles.bundleDiscount}>{tier.discountBadge}</div>
                  <p className={styles.bundleDesc}>{tier.description}</p>

                  <div className={styles.bundlePerks}>
                    <div className={styles.bundlePerkItem}>
                      <span className={styles.bundlePerkCheck}>✓</span>
                      <span>{tier.id === "bundle-all" ? "Semua 76+ preset lengkap" : `Bebas pilih ${tier.presetCount} preset`}</span>
                    </div>
                    <div className={styles.bundlePerkItem}>
                      <span className={styles.bundlePerkCheck}>✓</span>
                      <span>Format .DNG & .XMP siap pakai</span>
                    </div>
                    <div className={styles.bundlePerkItem}>
                      <span className={styles.bundlePerkCheck}>✓</span>
                      <span>Kirim otomatis via WhatsApp</span>
                    </div>
                    <div className={styles.bundlePerkItem}>
                      <span className={styles.bundlePerkCheck}>✓</span>
                      <span>Bonus panduan cara install di HP & PC</span>
                    </div>
                  </div>

                  <button
                    className={`btn ${tier.popular || tier.bestValue ? "btn-primary" : "btn-outline"} ${styles.bundleBtn}`}
                    onClick={() => {
                      setBundleCheckout(tier);
                      setShowBundle(false);
                    }}
                  >
                    Pilih Paket Ini →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Creator Reviews & Testimonials */}
      <section className={styles.reviewsSection}>
        <div className="container">
          <div className="text-center">
            <span className="badge badge-accent">Ulasan Pembeli</span>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#ffffff", marginTop: 8 }}>
              Dipercaya 1.850+ Kreator di Seluruh Indonesia
            </h2>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 8, color: "#f59e0b" }}>
              <span>★★★★★</span>
              <span style={{ color: "var(--text-2)", fontSize: 14 }}>Rating rata-rata 4.9 / 5.0</span>
            </div>
          </div>

          <div className={styles.reviewsGrid}>
            <div className={styles.reviewCard}>
              <div className={styles.reviewStars}>★★★★★</div>
              <div className={styles.reviewQuote}>
                "Tone preset Cinematic dan Film-nya gila sih! Skin tone orang Indonesia tetap natural dan gak kuning pucat. Hemat waktu editing pas wedding klien sampai 80%!"
              </div>
              <div className={styles.reviewAuthor}>
                <div className={styles.reviewAvatar} style={{ background: "linear-gradient(135deg, #6366f1, #a855f7)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  DP
                </div>
                <div>
                  <div className={styles.reviewAuthorName}>Dimas Prasetyo</div>
                  <div className={styles.reviewAuthorRole}>Wedding & Portrait Photographer · Bandung</div>
                </div>
              </div>
            </div>

            <div className={styles.reviewCard}>
              <div className={styles.reviewStars}>★★★★★</div>
              <div className={styles.reviewQuote}>
                "Pakai Lightroom gratisan di iPhone bisa langsung import tanpa kendala. Beli yang Ultimate All-Access beneran worth it banget, presets-nya lengkap dari aesthetic cafe sampai travel pantai."
              </div>
              <div className={styles.reviewAuthor}>
                <div className={styles.reviewAvatar} style={{ background: "linear-gradient(135deg, #ec4899, #f43f5e)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  CM
                </div>
                <div>
                  <div className={styles.reviewAuthorName}>Clarissa Mahira</div>
                  <div className={styles.reviewAuthorRole}>Content Creator TikTok & Reels · Jakarta</div>
                </div>
              </div>
            </div>

            <div className={styles.reviewCard}>
              <div className={styles.reviewStars}>★★★★★</div>
              <div className={styles.reviewQuote}>
                "Auto checkout via QRIS langsung beres, detik itu juga pesan WA masuk berisi kode download. Pas HP saya ganti tinggal buka portal unduh lagi, mantap garansinya!"
              </div>
              <div className={styles.reviewAuthor}>
                <div className={styles.reviewAvatar} style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  RF
                </div>
                <div>
                  <div className={styles.reviewAuthorName}>Reza Fahrezi</div>
                  <div className={styles.reviewAuthorRole}>Travel & Landscape Vlogger · Surabaya</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className={styles.faqSection}>
        <div className="container">
          <div className="text-center">
            <span className="badge badge-accent">Pertanyaan Umum</span>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#ffffff", marginTop: 8 }}>
              Frequently Asked Questions
            </h2>
            <p className="text-muted" style={{ maxWidth: 500, margin: "6px auto 0" }}>
              Semua hal yang perlu kamu ketahui sebelum membeli.
            </p>
          </div>

          <div className={styles.faqList}>
            {[
              {
                q: "Apakah saya harus berlangganan Lightroom CC berbayar?",
                a: "TIDAK! Preset LUMA 100% bisa digunakan di Adobe Lightroom Mobile versi GRATIS di iOS (iPhone/iPad) maupun Android. Anda tidak perlu membayar langganan bulanan Adobe."
              },
              {
                q: "Format file apa saja yang akan saya dapatkan?",
                a: "Setiap preset dilengkapi format .DNG (untuk Lightroom Mobile iOS & Android) dan format .XMP (untuk Lightroom Classic, Lightroom CC, dan Photoshop Camera Raw pada Desktop Mac & Windows)."
              },
              {
                q: "Bagaimana cara menerima file setelah melakukan pembayaran?",
                a: "Setelah pembayaran berhasil diverifikasi oleh sistem Midtrans, kode akses unduhan dan tautan download otomatis dikirim langsung ke nomor WhatsApp yang Anda daftarkan dalam hitungan detik."
              },
              {
                q: "Apakah preset bisa diunduh ulang jika saya mengganti handphone atau laptop?",
                a: "BISA! Anda mendapatkan jaminan lisensi seumur hidup (Lifetime Access). Cukup buka 'Portal Unduh' di pojok kanan atas website ini dan masukkan kode akses Anda untuk mendownload ulang kapan saja."
              },
              {
                q: "Metode pembayaran apa saja yang didukung?",
                a: "Kami mendukung pembayaran QRIS otomatis (BCA, Mandiri, BNI, BRI, GoPay, OVO, ShopeePay, DANA), Virtual Account Bank, dan Kartu Kredit melalui payment gateway Midtrans yang aman dan terverifikasi."
              }
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} className={styles.faqItem}>
                  <button
                    className={styles.faqQuestion}
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                  >
                    <span>{faq.q}</span>
                    <span style={{ fontSize: 18, color: "var(--accent)" }}>{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className={styles.faqAnswer}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust & Guarantee Badges */}
      <section className={styles.trustSection}>
        <div className="container">
          <div className={styles.trustGrid}>
            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className={styles.trustTitle}>Midtrans Terverifikasi</div>
              <div className={styles.trustDesc}>Pembayaran otomatis via QRIS (semua e-wallet & m-Banking), Virtual Account, dan Kartu Kredit.</div>
            </div>

            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className={styles.trustTitle}>Instant WhatsApp Delivery</div>
              <div className={styles.trustDesc}>Begitu pembayaran selesai, kode dan link unduhan otomatis masuk ke WhatsApp kamu detik itu juga.</div>
            </div>

            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>
                <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className={styles.trustTitle}>Garansi Akses Seumur Hidup</div>
              <div className={styles.trustDesc}>Ganti handphone atau laptop? Tinggal buka portal unduh dan masukkan kode akses kamu kapan saja.</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className="container">
          <p>© {new Date().getFullYear()} LUMA Presets · Lightroom Masterclass Collection</p>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>
            Adobe Lightroom® is a registered trademark of Adobe Inc. LUMA is not affiliated with Adobe Inc.
          </p>
        </div>
      </footer>

      {/* Modals */}
      {checkoutProduct && (
        <CheckoutModal
          product={checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {bundleCheckout && (
        <CheckoutModal
          product={null}
          bundleTier={bundleCheckout}
          products={availableProducts}
          onClose={() => setBundleCheckout(null)}
          onSuccess={handleCheckoutSuccess}
        />
      )}

      {showBundle && (
        <BundleModal
          tiers={bundleTiers}
          onClose={() => setShowBundle(false)}
          onSelectTier={(tier) => {
            setBundleCheckout(tier);
            setShowBundle(false);
          }}
        />
      )}

      {showDownload && (
        <DownloadPortal
          initialCode={downloadInitialCode}
          onClose={() => {
            setShowDownload(false);
            setDownloadInitialCode("");
          }}
        />
      )}

      {successOrder && (
        <PaymentSuccessModal
          order={successOrder}
          onClose={() => setSuccessOrder(null)}
          onDownload={(code) => {
            setDownloadInitialCode(code || successOrder.accessCode || "");
            setSuccessOrder(null);
            setShowDownload(true);
          }}
        />
      )}
    </div>
  );
}

// Category-specific placeholder images from Unsplash (high quality, free)
const CATEGORY_PLACEHOLDER_IMAGES = {
  Aesthetic: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=600&q=80",
  Cinematic: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=600&q=80",
  Film: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=600&q=80",
  Portrait: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80",
  Nature: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&q=80",
  Urban: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=600&q=80",
  HDR: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?auto=format&fit=crop&w=600&q=80",
  Travel: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
  Lifestyle: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80",
  Vintage: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80",
  Moody: "https://images.unsplash.com/photo-1504701954957-2010ec3bcec1?auto=format&fit=crop&w=600&q=80",
  General: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=600&q=80",
};

function ProductCard({ product, onBuy }) {
  const price = typeof product.price === "number" ? product.price : Number(product.price) || 0;
  const fallbackImg = CATEGORY_PLACEHOLDER_IMAGES[product.category] || CATEGORY_PLACEHOLDER_IMAGES.General;
  const imgSrc = product.image || fallbackImg;

  return (
    <div className={styles.productCard}>
      <div className={styles.productMediaWrap}>
        <img
          src={imgSrc}
          alt={product.name}
          className={styles.productImg}
          loading="lazy"
          onError={(e) => {
            e.target.src = fallbackImg;
          }}
        />
        <div className={styles.productImgOverlay} />
        <span className={styles.productFormatTag}>.DNG + .XMP</span>
        {product.hasFile && (
          <span className={styles.productReadyBadge}>✓ Siap Unduh</span>
        )}
      </div>

      <div className={styles.productBody}>
        <div className={styles.productMeta}>
          <span className="badge badge-accent">{product.category || "General"}</span>
        </div>
        <h3 className={styles.productName}>{product.name}</h3>
        {product.subtitle && <p className={styles.productSubtitle}>{product.subtitle}</p>}
        <div className={styles.productFooter}>
          <div>
            <span className={styles.productPrice}>
              Rp {price.toLocaleString("id-ID")}
            </span>
          </div>
          <button className="btn btn-primary btn-sm" onClick={onBuy}>
            Beli Preset
          </button>
        </div>
      </div>
    </div>
  );
}
