import { NextResponse } from "next/server";
import { AccessCodeModel } from "@/lib/models/accessCode.model.js";
import { ProductModel } from "@/lib/models/product.model.js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const code = (body?.code || "").trim().toUpperCase();
    if (!code) return NextResponse.json({ error: "Kode akses wajib diisi" }, { status: 400 });

    const ac = await AccessCodeModel.findByCode(code);
    if (!ac) return NextResponse.json({ error: "Kode akses tidak valid atau tidak ditemukan." }, { status: 404 });

    const product = await ProductModel.findById(ac.product_id);
    if (!product) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });

    let bundleProducts = [];
    let isBundle = false;

    if (ac.bundle_items) {
      try {
        const itemIds = JSON.parse(ac.bundle_items);
        if (Array.isArray(itemIds) && itemIds.length > 0) {
          isBundle = true;
          const prods = await Promise.all(itemIds.map((id) => ProductModel.findById(id)));
          bundleProducts = prods.filter(Boolean);
        }
      } catch (err) {
        console.warn("Parse bundle items error:", err.message);
      }
    }

    return NextResponse.json({
      valid: true,
      code: ac.code,
      used: !!ac.used,
      usedAt: ac.used_at,
      downloadsCount: ac.downloads_count || 0,
      isBundle,
      bundleProducts,
      product: {
        id: product.id,
        code: product.code,
        name: product.name,
        subtitle: product.subtitle,
        category: product.category,
        image: product.image,
        hasFile: product.hasFile
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
