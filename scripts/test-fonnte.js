import "dotenv/config";

const token = (process.env.FONNTE_TOKEN || "").trim();
const target = process.argv[2] || "6281519025792";

async function test() {
  console.log(`📡 Memeriksa status device Fonnte (Token: ${token.slice(0, 6)}...)...`);
  
  const devRes = await fetch("https://api.fonnte.com/device", {
    method: "POST",
    headers: { Authorization: token }
  });
  const devData = await devRes.json();
  console.log("Device Info:", devData);

  if (devData.device_status !== "connect") {
    console.log("\n⚠️  Device Fonnte status: DISCONNECT!");
    console.log("👉 Buka QR Code di browser: http://localhost:5173/fonnte-qr.png");
    console.log("👉 Buka WhatsApp di HP > Perangkat Tertaut > Scan QR Code tersebut.");
    return;
  }

  console.log(`\n📤 Mencoba kirim pesan uji coba ke ${target}...`);
  const sendRes = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify({
      target,
      message: "Halo! Ini pesan tes otomatis dari LUMA PRESETS 📸✨\nSistem WhatsApp gateway Anda sudah BERHASIL terhubung dan aktif!",
      countryCode: "62"
    })
  });
  const sendData = await sendRes.json();
  console.log("Hasil Kirim:", sendData);
}

test().catch(console.error);
