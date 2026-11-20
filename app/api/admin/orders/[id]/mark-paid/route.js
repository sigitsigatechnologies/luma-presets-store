import { NextResponse } from "next/server";
import { OrderModel } from "@/lib/models/order.model.js";
import { processPaymentSuccess } from "@/lib/payment.js";
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

    const result = await processPaymentSuccess(order, "manual_admin");
    return NextResponse.json({ ok: true, orderId: id, ...result });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
