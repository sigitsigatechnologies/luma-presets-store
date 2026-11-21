import { NextResponse } from "next/server";
import { WhatsAppService } from "@/lib/services/whatsapp.service.js";
import { OrderModel } from "@/lib/models/order.model.js";
import { MidtransService } from "@/lib/services/midtrans.service.js";
import { processPaymentSuccess } from "@/lib/payment.js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const rawPhone = (body?.phone || "").trim();
    const phone = WhatsAppService.normalizePhone(rawPhone);
    if (!phone || phone.length < 9) {
      return NextResponse.json({ error: "Nomor WhatsApp tidak valid." }, { status: 400 });
    }

    const orders = await OrderModel.findByPhone(phone);

    // Refresh status pending dari Midtrans agar status terbaru
    for (const o of orders) {
      if (o.status !== "PAID") {
        try {
          const midtransData = await MidtransService.checkTransactionStatus(o.id);
          if (midtransData) {
            const t = midtransData.transaction_status;
            const f = midtransData.fraud_status;
            const paid = t === "settlement" || (t === "capture" && f === "accept");
            if (paid) await processPaymentSuccess(o, midtransData.payment_type || "midtrans");
            else if (["deny", "cancel", "expire"].includes(t)) await OrderModel.updateStatus(o.id, { status: "FAILED" });
          }
        } catch (_) {}
      }
    }

    const fresh = await OrderModel.findByPhone(phone);
    const data = fresh.map((o) => ({
      orderId: o.id,
      productName: o.products?.name || o.product_id,
      productCode: o.products?.code || "",
      amount: o.amount,
      status: o.status,
      accessCode: o.status === "PAID" ? o.access_code : null,
      paidAt: o.paid_at,
      createdAt: o.created_at,
      expiresAt: MidtransService.getExpiresAt(o.created_at),
      expiryMinutes: MidtransService.getExpiryMinutes()
    }));

    return NextResponse.json({ orders: data });
  } catch (err) {
    console.error("[orders/lookup]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
