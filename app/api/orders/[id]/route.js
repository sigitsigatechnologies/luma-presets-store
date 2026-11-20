import { NextResponse } from "next/server";
import { OrderModel } from "@/lib/models/order.model.js";
import { ProductModel } from "@/lib/models/product.model.js";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const order = await OrderModel.findById(id);
    if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });

    const product = await ProductModel.findById(order.product_id);

    return NextResponse.json({
      orderId: order.id,
      productId: order.product_id,
      productName: product?.name || "",
      productCode: product?.code || "",
      productImage: product?.image || "",
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerEmail: order.customer_email,
      amount: order.amount,
      status: order.status,
      snapToken: order.midtrans_snap_token,
      redirectUrl: order.midtrans_redirect_url,
      accessCode: order.status === "PAID" ? order.access_code : null,
      paidAt: order.paid_at,
      createdAt: order.created_at
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
