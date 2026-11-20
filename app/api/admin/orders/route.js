import { NextResponse } from "next/server";
import { OrderModel } from "@/lib/models/order.model.js";
import { isAuthenticated } from "@/lib/auth.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    if (!isAuthenticated(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await OrderModel.findAll();
    return NextResponse.json(orders);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
