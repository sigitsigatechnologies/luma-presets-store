import Link from "next/link";
import { ArrowLeftIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import styles from "../info.module.css";

export const metadata = {
  title: "Syarat & Ketentuan — LUMA Presets",
  description: "Syarat dan ketentuan pembelian serta penggunaan preset Lightroom LUMA Presets."
};

const SECTIONS = [
  {
    title: "1. Penerimaan Syarat",
    body: (
      <p>
        Dengan mengakses situs LUMA Presets, melakukan pembelian, atau menggunakan produk yang kami
        sediakan, Anda dianggap telah membaca, memahami, dan menyetujui seluruh Syarat & Ketentuan ini.
        Jika Anda tidak setuju, mohon untuk tidak menggunakan layanan kami.
      </p>
    )
  },
  {
    title: "2. Produk & Lisensi",
    body: (
      <>
        <p>
          LUMA Presets menjual produk digital berupa file preset Lightroom (format <strong>.xmp</strong>)
          yang dikemas dalam file <strong>.zip</strong>. Setiap pembelian memberikan lisensi
          <strong> non-eksklusif, non-transferable</strong> untuk menggunakan preset pada foto milik Anda
          sendiri, baik untuk keperluan pribadi maupun komersial.
        </p>
        <ul>
          <li>Lisensi berlaku untuk satu pembeli dan tidak dapat dipindahtangankan.</li>
          <li>Anda boleh menggunakan hasil edit untuk konten pribadi, klien, maupun portofolio.</li>
          <li>Anda tidak boleh menjual, membagikan, mengunggah ulang, atau mengklaim preset sebagai milik Anda.</li>
        </ul>
      </>
    )
  },
  {
    title: "3. Pembayaran",
    body: (
      <>
        <p>
          Pembayaran diproses melalui Midtrans dan mendukung QRIS, GoPay, ShopeePay, Virtual Account
          (BCA, Mandiri, BNI, BRI), serta kartu kredit. Harga yang tertera adalah harga dalam Rupiah dan
          dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya.
        </p>
        <ul>
          <li>Pesanan diproses otomatis setelah pembayaran terverifikasi.</li>
          <li>Pastikan nominal dan metode pembayaran sudah benar sebelum menyelesaikan transaksi.</li>
          <li>Biaya tambahan dari bank atau penyedia pembayaran, jika ada, menjadi tanggung jawab pembeli.</li>
        </ul>
      </>
    )
  },
  {
    title: "4. Pengiriman & Unduhan",
    body: (
      <>
        <p>
          Produk digital dikirim secara otomatis ke nomor WhatsApp yang Anda daftarkan saat checkout,
          berisi kode akses dan tautan unduhan. Anda juga dapat mengunduh melalui halaman
          <Link href="/order"> Cek Pesanan</Link> menggunakan nomor WhatsApp atau ID pesanan.
        </p>
        <ul>
          <li>File disediakan dalam bentuk <strong>.zip</strong> berisi file <strong>.xmp</strong> dan panduan instalasi.</li>
          <li>Simpan kode akses dan file Anda dengan baik. Kode akses bersifat pribadi.</li>
          <li>Jika file rusak atau tidak dapat diunduh, hubungi kami untuk penggantian file.</li>
        </ul>
      </>
    )
  },
  {
    title: "5. Kebijakan Pengembalian Dana",
    body: (
      <>
        <p>
          Karena produk digital bersifat langsung dapat diakses dan disalin, pembelian
          <strong> tidak dapat dibatalkan atau dikembalikan</strong> setelah file dikirim atau diunduh,
          kecuali terdapat kendala teknis yang tidak dapat kami perbaiki.
        </p>
        <ul>
          <li>Pengembalian dana dapat dipertimbangkan jika file tidak dapat diakses sama sekali dan penggantian file tidak berhasil.</li>
          <li>Perbedaan hasil warna akibat perbedaan kamera, pencahayaan, atau versi Lightroom bukan alasan pengembalian dana.</li>
          <li>Ajukan kendala maksimal 7 hari setelah pembelian melalui WhatsApp resmi kami.</li>
        </ul>
      </>
    )
  },
  {
    title: "6. Hak Kekayaan Intelektual",
    body: (
      <p>
        Seluruh preset, materi promosi, logo, dan konten di situs ini dilindungi hak cipta dan merupakan
        milik LUMA Presets. Adobe Lightroom dan merek terkait adalah merek dagang Adobe Inc. LUMA Presets
        tidak berafiliasi dengan Adobe. Penggunaan nama merek tersebut hanya sebagai referensi kompatibilitas.
      </p>
    )
  },
  {
    title: "7. Larangan Penggunaan",
    body: (
      <>
        <p>Anda dilarang menggunakan produk atau situs ini untuk:</p>
        <ul>
          <li>Menjual ulang, menyewakan, atau mendistribusikan preset tanpa izin tertulis dari kami.</li>
          <li>Mengunggah preset ke platform berbagi file, grup, atau layanan berlangganan pihak ketiga.</li>
          <li>Mengklaim preset sebagai karya sendiri atau mendaftarkannya sebagai merek.</li>
          <li>Tindakan yang melanggar hukum, merugikan pihak lain, atau merusak layanan kami.</li>
        </ul>
      </>
    )
  },
  {
    title: "8. Batasan Tanggung Jawab",
    body: (
      <p>
        Produk disediakan sebagaimana adanya. Kami tidak menjamin hasil akhir akan identik pada setiap
        foto karena hasil dipengaruhi oleh kamera, lensa, pencahayaan, dan pengaturan Lightroom. Sepanjang
        diizinkan hukum, tanggung jawab kami atas kerugian apa pun dibatasi pada nilai pembelian produk
        yang bersangkutan.
      </p>
    )
  },
  {
    title: "9. Perubahan Syarat",
    body: (
      <p>
        Kami dapat memperbarui Syarat & Ketentuan ini sewaktu-waktu. Versi terbaru akan dipublikasikan
        di halaman ini beserta tanggal pembaruan. Dengan terus menggunakan layanan setelah perubahan,
        Anda dianggap menyetujui syarat yang diperbarui.
      </p>
    )
  },
  {
    title: "10. Hukum yang Berlaku & Kontak",
    body: (
      <p>
        Syarat & Ketentuan ini tunduk pada hukum yang berlaku di Indonesia. Untuk pertanyaan, kendala
        pesanan, atau permintaan bantuan, silakan hubungi tim kami melalui halaman
        <Link href="/contact"> Kontak</Link> atau WhatsApp resmi LUMA Presets.
      </p>
    )
  }
];

export default function TermsPage() {
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
            <DocumentTextIcon className="h-4 w-4" aria-hidden="true" />
            Legal
          </span>
          <h1 className={styles.title}>Syarat &amp; Ketentuan</h1>
          <p className={styles.lead}>
            Ketentuan pembelian, lisensi, dan penggunaan preset digital LUMA Presets.
          </p>
          <p className={styles.updated}>Terakhir diperbarui: 21 November 2026</p>

          <div className={styles.card}>
            {SECTIONS.map((section) => (
              <section key={section.title} className={styles.section}>
                <h2>{section.title}</h2>
                {section.body}
              </section>
            ))}
          </div>

          <div className={styles.note}>
            Ringkasan: preset boleh dipakai untuk foto pribadi dan komersial Anda, tetapi tidak boleh
            dijual ulang atau dibagikan. Produk digital tidak dapat dikembalikan setelah diunduh, kecuali
            ada kendala teknis yang tidak dapat kami perbaiki.
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
