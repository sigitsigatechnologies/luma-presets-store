import Link from "next/link";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  QuestionMarkCircleIcon
} from "@heroicons/react/24/outline";
import styles from "../info.module.css";

export const metadata = {
  title: "Kontak — LUMA Presets",
  description: "Hubungi tim LUMA Presets untuk bantuan pesanan, pembayaran, atau unduhan preset."
};

const WHATSAPP_URL =
  "https://wa.me/6281519025792?text=Halo%20LUMA%20Presets%2C%20saya%20butuh%20bantuan.";

const CONTACTS = [
  {
    icon: ChatBubbleLeftRightIcon,
    title: "WhatsApp Helpdesk",
    description: "Respon tercepat untuk kendala pesanan, pembayaran, dan unduhan. Senin–Sabtu, 09.00–21.00 WIB.",
    href: WHATSAPP_URL,
    label: "Chat WhatsApp",
    external: true,
    primary: true
  },
  {
    icon: ArrowPathIcon,
    title: "Cek Pesanan",
    description: "Pantau status pembayaran dan unduh preset menggunakan nomor WhatsApp atau ID pesanan.",
    href: "/order",
    label: "Buka Cek Pesanan"
  },
  {
    icon: QuestionMarkCircleIcon,
    title: "Pertanyaan Umum",
    description: "Jawaban cepat seputar pembelian, pengiriman otomatis, kompatibilitas, dan cara import preset.",
    href: "/#faq",
    label: "Lihat FAQ"
  },
  {
    icon: DocumentTextIcon,
    title: "Syarat & Ketentuan",
    description: "Baca ketentuan lisensi, pembayaran, pengiriman, dan kebijakan pengembalian dana.",
    href: "/terms",
    label: "Baca S&K"
  }
];

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <div className="container">
          <div className={styles.navInner}>
            <Link href="/" className={styles.logo}>
              LUMA <span>Presets</span>
            </Link>
            <Link href="/" className={styles.back}>
              <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
              <span className={styles.backLabel}>Kembali ke Toko</span>
            </Link>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.wrap}>
          <span className={styles.eyebrow}>
            <ChatBubbleLeftRightIcon className="h-4 w-4" aria-hidden="true" />
            Bantuan
          </span>
          <h1 className={styles.title}>Hubungi LUMA Presets</h1>
          <p className={styles.lead}>
            Ada kendala pembayaran, pesanan, atau unduhan? Tim kami siap membantu. Untuk pembelian dan
            pengiriman otomatis, layanan tersedia 24 jam.
          </p>
          <p className={styles.updated}>Rata-rata respons WhatsApp: kurang dari 1×24 jam pada hari kerja.</p>

          <div className={styles.contactGrid}>
            {CONTACTS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className={styles.contactCard}>
                  <span className={styles.icon}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`btn ${item.primary ? "btn-primary" : "btn-outline"}`}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link href={item.href} className={`btn ${item.primary ? "btn-primary" : "btn-outline"}`}>
                      {item.label}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.card} style={{ marginTop: 22 }}>
            <section className={styles.section}>
              <h2>Sebelum menghubungi kami</h2>
              <p>Agar masalah lebih cepat diselesaikan, siapkan informasi berikut:</p>
              <ul>
                <li>ID pesanan atau nomor WhatsApp yang digunakan saat checkout.</li>
                <li>Tangkapan layar (screenshot) pesan error atau halaman yang bermasalah.</li>
                <li>Jenis perangkat dan aplikasi yang digunakan (iPhone/Android, Lightroom Mobile/Desktop).</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2>Kendala umum</h2>
              <ul>
                <li>
                  <strong>Kode akses belum masuk:</strong> cek WhatsApp dan folder spam, lalu buka halaman
                  <Link href="/order"> Cek Pesanan</Link>.
                </li>
                <li>
                  <strong>File tidak bisa dibuka di iPhone:</strong> ekstrak file <strong>.zip</strong> di
                  aplikasi Files, lalu impor file <strong>.xmp</strong> melalui Lightroom &rarr; Presets
                  &rarr; titik tiga (...) &rarr; Import Presets.
                </li>
                <li>
                  <strong>Warna kurang cocok:</strong> sesuaikan Exposure dan Temperature setelah preset
                  diterapkan. Hasil dapat berbeda tergantung kamera dan pencahayaan.
                </li>
              </ul>
            </section>
          </div>

          <div className={styles.note}>
            Jangan pernah membagikan kode akses atau file preset Anda kepada orang lain. Kode akses bersifat
            pribadi dan hanya berlaku untuk pembelian Anda.
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerInner}>
            <span>© {new Date().getFullYear()} LUMA Presets</span>
            <div className={styles.footerLinks}>
              <Link href="/">Beranda</Link>
              <Link href="/contact">Kontak</Link>
              <Link href="/terms">Syarat &amp; Ketentuan</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
