import { NextResponse } from "next/server";
import { OrderModel } from "@/lib/models/order.model.js";
import { ProductModel } from "@/lib/models/product.model.js";
import { processPaymentSuccess } from "@/lib/payment.js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { orderId } = body || {};
    if (!orderId) return NextResponse.json({ error: "orderId diperlukan" }, { status: 400 });

    const order = await OrderModel.findById(orderId);
    if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });

    const product = await ProductModel.findById(order.product_id);
    const result = await processPaymentSuccess(order, "simulation");

    return NextResponse.json({
      ok: true,
      simulated: true,
      status: "PAID",
      orderId: order.id,
      accessCode: result.accessCode || order.access_code,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone,
      productName: product?.name || "",
      amount: order.amount,
      paidAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("[simulate error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
