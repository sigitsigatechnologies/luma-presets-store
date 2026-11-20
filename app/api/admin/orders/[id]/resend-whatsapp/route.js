import { NextResponse } from "next/server";
import { OrderModel } from "@/lib/models/order.model.js";
import { ProductModel } from "@/lib/models/product.model.js";
import { WhatsAppService } from "@/lib/services/whatsapp.service.js";
import { config } from "@/lib/config/env.js";
import { isAuthenticated } from "@/lib/auth.js";

export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  try {
    if (!isAuthenticated(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const order = await OrderModel.findById(id);
    if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    if (!order.customer_phone) return NextResponse.json({ error: "Nomor WhatsApp pembeli tidak tercatat" }, { status: 400 });

    const product = await ProductModel.findById(order.product_id);
    const downloadUrl = `${config.appUrl}/#download?orderId=${encodeURIComponent(order.id)}&code=${encodeURIComponent(order.access_code || "")}`;

    let deliveryProductName = product?.name || "Lightroom Preset";
    if (order.bundle_items) {
      try {
        const items = JSON.parse(order.bundle_items);
        deliveryProductName = `${product?.name || "Paket Bundling"} (${items.length} Preset Pilihan)`;
      } catch {}
    }

    const result = await WhatsAppService.sendMessage({
      phone: order.customer_phone,
      message: WhatsAppService.buildDeliveryMessage({
        customerName: order.customer_name,
        productName: deliveryProductName,
        productCode: product?.code || "",
        orderId: order.id,
        accessCode: order.access_code || "HUBUNGI ADMIN",
        downloadUrl
      })
    });

    return NextResponse.json({ result, phone: order.customer_phone });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
