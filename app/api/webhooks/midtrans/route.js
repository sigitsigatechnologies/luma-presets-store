import { NextResponse } from "next/server";
import { OrderModel } from "@/lib/models/order.model.js";
import { MidtransService } from "@/lib/services/midtrans.service.js";
import { processPaymentSuccess } from "@/lib/payment.js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("[Next.js Webhook] Midtrans notification received:", JSON.stringify(body));

    const { order_id, transaction_status, fraud_status, status_code, gross_amount, signature_key, payment_type } = body || {};

    if (!order_id) {
      return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
    }

    // 1. Verifikasi SHA-512 Signature
    if (!MidtransService.verifySignature({ order_id, status_code, gross_amount, signature_key })) {
      console.warn("[Webhook] Signature mismatch!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    // 2. Cari order
    const order = await OrderModel.findById(order_id);
    if (!order) {
      console.warn(`[Webhook] Order tidak ditemukan: ${order_id}`);
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 3. Verifikasi jumlah bayar
    const paidAmount = parseFloat(gross_amount || "0");
    if (order.amount && Math.abs(paidAmount - order.amount) > 1) {
      console.warn(`[Webhook] Nominal tidak cocok: dibayar ${paidAmount} vs seharusnya ${order.amount}`);
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    // 4. Periksa status pembayaran
    const isSuccess =
      (transaction_status === "capture" && fraud_status === "accept") ||
      transaction_status === "settlement";

    const isFailed = ["deny", "cancel", "expire"].includes(transaction_status);
    const isPending = transaction_status === "pending";

    if (isSuccess) {
      const result = await processPaymentSuccess(order, payment_type);
      return NextResponse.json({ ok: true, ...result });
    }

    if (isFailed) {
      await OrderModel.updateStatus(order.id, { status: "FAILED" });
      return NextResponse.json({ ok: true, status: "FAILED" });
    }

    if (isPending) {
      const txId = body.transaction_id;
      if (txId) {
        await OrderModel.updateStatus(order.id, { status: "PENDING", transactionId: txId });
      }
      return NextResponse.json({ ok: true, status: "PENDING" });
    }

    return NextResponse.json({ ok: true, status: order.status });
  } catch (err) {
    console.error("[Webhook error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
