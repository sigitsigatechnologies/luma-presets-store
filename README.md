# LUMA Presets Store

Toko preset Lightroom premium — dibangun **100% Fullstack dengan Next.js App Router** (Frontend & Backend API terpadu) + **Supabase Cloud** (Database & Base64 Preset Storage) + **Midtrans Snap** (Payment Gateway) + **Fonnte** (Instant WhatsApp Delivery).

## 🚀 Fitur Utama

- **Katalog Terkategori & Shelves View**: 76 preset dikelompokkan per kategori (Aesthetic, Cinematic, Film, Portrait, Nature, Urban, HDR, Travel, Lifestyle).
- **Interactive Before & After Slider**: Bandingkan foto RAW vs Preset LUMA langsung dengan slider interaktif.
- **Paket Bundling Kustom**: Bebas pilih 3, 5, 10, atau All-Access 76 preset dengan diskon hingga 93%.
- **Pembayaran Otomatis Midtrans**: QRIS, GoPay, ShopeePay, Virtual Account (BCA, Mandiri, BNI, BRI), Kartu Kredit.
- **Pengiriman Instan WhatsApp (Fonnte)**: Kode akses & link unduhan otomatis dikirim ke nomor WA pembeli detik itu juga setelah pembayaran terverifikasi.
- **Streaming Download Langsung dari Supabase**: File `.zip` berisi `.xmp` dan panduan instalasi di-stream langsung dari database Supabase Cloud (Base64 in-memory tanpa filesystem lokal).
- **Panel Admin Lengkap (`/admin`)**:
  - CRUD Produk: Tambah, edit, upload file preset `.zip`/`.xmp`, preview gambar, toggle status 1-klik, dan hapus.
  - Manajemen Pesanan: Pencarian, filter, tandai lunas 1-klik, resend WhatsApp, dan salin kode akses.
  - Manual VIP Code Generator: Terbitkan kode akses kustom untuk preset satuan maupun paket bundling.

## 📁 Struktur Direktori

```text
luma-presets-store/
├── app/                    # Next.js App Router (Frontend + API Handlers)
│   ├── page.js             # Storefront utama (Shelves view, B&A slider, FAQ, Reviews)
│   ├── layout.js           # Root layout & font
│   ├── globals.css         # Styling global
│   ├── admin/              # Panel Admin lengkap (Dashboard, CRUD, Orders, VIP Codes)
│   ├── api/                # Unified Fullstack API Route Handlers
│   │   ├── products/       # GET all, POST create, [id] PUT/DELETE, toggle status
│   │   ├── orders/         # POST checkout, [id] GET, check-status, simulate
│   │   ├── payments/       # Webhooks & simulation aliases
│   │   ├── download/       # Validate access code & stream ZIP file
│   │   └── admin/          # Admin orders management & VIP code generator
│   └── components/         # Komponen UI (CheckoutModal, DownloadPortal, dll.)
├── lib/                    # Shared Backend Core & Services
│   ├── config/             # env.js, database.js (Supabase client), bundles.js
│   ├── models/             # ProductModel, OrderModel, AccessCodeModel (Supabase)
│   ├── services/           # midtrans.service.js, whatsapp.service.js
│   └── utils/              # zip.js (Pure Node.js PKZIP builder & extractor)
├── scripts/                # Database Scripts
│   ├── sync-to-supabase.js # Sinkronisasi data & Base64 ZIP ke Supabase
│   └── populate-files-to-supabase.js # Injeksi binary ZIP XMP ke Supabase
└── public/                 # Static assets publik
```

## 🛠️ Menjalankan Aplikasi

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Jalankan Aplikasi (Port 3000)**:
   ```bash
   npm run dev
   ```
   Buka browser di:
   - Storefront: [http://localhost:3000](http://localhost:3000)
   - Panel Admin: [http://localhost:3000/admin](http://localhost:3000/admin) (Username: `admin`, Password: `admin123`)

3. **Build Produksi**:
   ```bash
   npm run build
   npm run start
   ```
