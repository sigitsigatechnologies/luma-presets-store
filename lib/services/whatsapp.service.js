import { config } from "../config/env.js";

export const WhatsAppService = {
  normalizePhone(phone) {
    if (!phone) return "";
    let p = String(phone).replace(/[^0-9]/g, "");
    if (p.startsWith("0")) p = "62" + p.slice(1);
    else if (p.startsWith("8")) p = "62" + p;
    return p;
  },

  buildDeliveryMessage({ customerName, productName, productCode, orderId, accessCode, downloadUrl }) {
    const name = customerName ? customerName.trim() : "Kak";
    const preset = productCode ? `${productCode} — ${productName}` : productName;

    return `Halo ${name}! Terima kasih telah berbelanja di *LUMA PRESETS* 📸✨

Pembayaran Anda telah *BERHASIL* diverifikasi.

━━━━━━━━━━━━━━━━━━━
📦 *DETAIL PESANAN*
• No. Order : *${orderId}*
• Produk    : *${preset}*
• Status    : *LUNAS ✅*
━━━━━━━━━━━━━━━━━━━

🔑 *KODE AKSES DOWNLOAD:*
*${accessCode}*

📥 *LINK DOWNLOAD LANGSUNG:*
${downloadUrl}

📱 *CARA INSTALL PRESET:*
1. Buka link download di atas
2. Masukkan kode akses: *${accessCode}*
3. Download file .zip preset Anda
4. Buka aplikasi Lightroom Mobile
5. Import foto DNG, lalu Copy Settings
6. Paste ke foto Anda — selesai! ✨

Butuh bantuan? Silakan balas pesan WhatsApp ini.
_LUMA PRESETS — Edit your everyday_`;
  },

  async sendMessage({ phone, message }) {
    const token = config.fonnte.token;
    const target = this.normalizePhone(phone);

    if (!target || !message || !token) {
      console.warn("[Fonnte] Parameter phone/message/token tidak lengkap");
      return { success: false, reason: "Missing phone/message/token" };
    }

    try {
      const res = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token
        },
        body: JSON.stringify({
          target,
          message,
          countryCode: "62"
        })
      });

      let data;
      try { data = await res.json(); } catch { data = await res.text(); }

      if (!res.ok || (data && data.status === false)) {
        console.warn("[Fonnte] Send failed:", data);
        return { success: false, detail: data };
      }

      console.log(`[Fonnte] Pesan terkirim ke ${target}`);
      return { success: true, detail: data };
    } catch (err) {
      console.error("[Fonnte] Error:", err.message);
      return { success: false, reason: err.message };
    }
  },

  async getDeviceStatus() {
    const token = config.fonnte.token;
    if (!token) return { connected: false, reason: "No token" };

    try {
      const res = await fetch("https://api.fonnte.com/device", {
        method: "POST",
        headers: { Authorization: token }
      });
      return await res.json();
    } catch (err) {
      return { connected: false, error: err.message };
    }
  }
};
