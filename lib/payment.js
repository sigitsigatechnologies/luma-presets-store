import { OrderModel } from "./models/order.model.js";
import { ProductModel } from "./models/product.model.js";
import { AccessCodeModel, generateAccessCode } from "./models/accessCode.model.js";
import { WhatsAppService } from "./services/whatsapp.service.js";
import { config } from "./config/env.js";

export async function processPaymentSuccess(order, paymentType = "unknown") {
  if (order.status === "PAID" && order.access_code) {
    console.log(`[Payment Flow] Order ${order.id} sudah berstatus LUNAS.`);
    return { status: "PAID", alreadyProcessed: true, accessCode: order.access_code };
  }

  const accessCode = generateAccessCode();
  const now = new Date().toISOString();

  // 1. Simpan kode akses ke database
  await AccessCodeModel.create(accessCode, order.product_id, order.id, order.bundle_items);

  // 2. Update status order menjadi PAID di database
  await OrderModel.updateStatus(order.id, {
    status: "PAID",
    accessCode,
    paidAt: now,
    paymentType
  });

  console.log(`[Payment Flow] Order ${order.id} → LUNAS ✅ (Kode: ${accessCode})`);

  // 3. Kirim WhatsApp otomatis via Fonnte
  const product = await ProductModel.findById(order.product_id);
  const clientAppUrl = config.appUrl.replace(/\/$/, "");
  const downloadUrl = `${clientAppUrl}/order?orderId=${encodeURIComponent(order.id)}`;

  let deliveryProductName = product?.name || "Lightroom Preset";
  if (order.bundle_items) {
    try {
      const items = JSON.parse(order.bundle_items);
      deliveryProductName = `${product?.name || "Paket Bundling"} (${items.length} Preset Pilihan)`;
    } catch {}
  }

  const waResult = await WhatsAppService.sendMessage({
    phone: order.customer_phone,
    message: WhatsAppService.buildDeliveryMessage({
      customerName: order.customer_name,
      productName: deliveryProductName,
      productCode: product?.code || "",
      orderId: order.id,
      accessCode,
      downloadUrl
    })
  });

  return {
    status: "PAID",
    alreadyProcessed: false,
    accessCode,
    orderId: order.id,
    whatsappSent: waResult.success,
    whatsappError: waResult.error || null
  };
}
