import { NextResponse } from "next/server";
import { OrderModel } from "@/lib/models/order.model.js";
import { ProductModel } from "@/lib/models/product.model.js";
import { MidtransService } from "@/lib/services/midtrans.service.js";
import { processPaymentSuccess } from "@/lib/payment.js";

export const dynamic = "force-dynamic";

async function handleCheckStatus(id) {
  const order = await OrderModel.findById(id);
  if (!order) return { status: 404, data: { error: "Pesanan tidak ditemukan" } };

  const product = await ProductModel.findById(order.product_id);

  // 1. If already PAID in our DB, return immediately
  if (order.status === "PAID") {
    return {
      status: 200,
      data: {
        status: "PAID",
        orderId: order.id,
        accessCode: order.access_code,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: order.customer_phone,
        productName: product?.name || "",
        amount: order.amount,
        paidAt: order.paid_at
      }
    };
  }

  // 2. Query Midtrans API directly to check if customer has paid
  const midtransData = await MidtransService.checkTransactionStatus(order.id);
  if (midtransData) {
    const tStatus = midtransData.transaction_status;
    const fStatus = midtransData.fraud_status;

    const isPaid =
      tStatus === "settlement" ||
      (tStatus === "capture" && fStatus === "accept");

    if (isPaid) {
      const result = await processPaymentSuccess(order, midtransData.payment_type || "midtrans");
      return {
        status: 200,
        data: {
          status: "PAID",
          orderId: order.id,
          accessCode: result.accessCode || order.access_code,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          customerPhone: order.customer_phone,
          productName: product?.name || "",
          amount: order.amount,
          paidAt: new Date().toISOString()
        }
      };
    }
  }

  // Still pending
  return {
    status: 200,
    data: {
      status: order.status,
      orderId: order.id,
      amount: order.amount
    }
  };
}

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const res = await handleCheckStatus(id);
    return NextResponse.json(res.data, { status: res.status });
  } catch (err) {
    console.error("[check-status GET error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const res = await handleCheckStatus(id);
    return NextResponse.json(res.data, { status: res.status });
  } catch (err) {
    console.error("[check-status POST error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
