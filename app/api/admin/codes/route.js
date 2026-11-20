import { NextResponse } from "next/server";
import { ProductModel } from "@/lib/models/product.model.js";
import { AccessCodeModel, generateAccessCode } from "@/lib/models/accessCode.model.js";
import { isAuthenticated } from "@/lib/auth.js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    if (!isAuthenticated(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const productId = body?.productId || "";
    const bundleItems = body?.bundleItems || null;

    const product = await ProductModel.findById(productId);
    if (!product) return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });

    const code = generateAccessCode();
    await AccessCodeModel.create(code, productId, null, bundleItems);
    return NextResponse.json({ code, productId, productName: product.name }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
