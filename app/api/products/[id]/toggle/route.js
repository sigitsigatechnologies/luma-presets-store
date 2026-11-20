import { NextResponse } from "next/server";
import { ProductModel } from "@/lib/models/product.model.js";
import { isAuthenticated } from "@/lib/auth.js";

export const dynamic = "force-dynamic";

export async function POST(req, { params }) {
  try {
    if (!isAuthenticated(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await ProductModel.findById(id);
    if (!existing) return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });

    const newAvailable = !existing.available;
    const updated = await ProductModel.update(id, {
      available: newAvailable,
      status: newAvailable ? "AVAILABLE" : "INACTIVE"
    });

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
