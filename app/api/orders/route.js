import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { OrderModel } from "@/lib/models/order.model.js";
import { ProductModel } from "@/lib/models/product.model.js";
import { MidtransService } from "@/lib/services/midtrans.service.js";
import { WhatsAppService } from "@/lib/services/whatsapp.service.js";
import { getBundleTier } from "@/lib/config/bundles.js";
import { config } from "@/lib/config/env.js";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    const body = await req.json();
    const { productId, bundleTier, selectedProductIds, customerName, customerPhone, customerEmail } = body || {};

    const name = (customerName || "").trim();
    const phone = WhatsAppService.normalizePhone(customerPhone);
    const email = (customerEmail || "").trim();

    if (!name) return NextResponse.json({ error: "Nama lengkap wajib diisi." }, { status: 400 });
    if (!phone || phone.length < 9) return NextResponse.json({ error: "Nomor WhatsApp wajib diisi (min 9 digit)." }, { status: 400 });
    if (email && !email.includes("@")) return NextResponse.json({ error: "Format email tidak valid." }, { status: 400 });

    let orderProductId = productId;
    let orderProductName = "";
    let orderProductCode = "";
    let amount = 0;
    let bundleItemsJson = null;

    if (bundleTier) {
      const tier = getBundleTier(bundleTier);
      if (!tier) return NextResponse.json({ error: "Paket bundling tidak valid." }, { status: 400 });

      let items = Array.isArray(selectedProductIds) ? selectedProductIds : [];
      if (tier.id === "bundle-all" && items.length === 0) {
        const allProds = await ProductModel.findAll();
        items = allProds.map((p) => p.id);
      }

      if (tier.id !== "bundle-all" && items.length !== tier.presetCount) {
        return NextResponse.json({
          error: `Silakan pilih tepat ${tier.presetCount} preset untuk ${tier.name}. (Saat ini: ${items.length} dipilih)`
        }, { status: 400 });
      }

      orderProductId = tier.id;
      orderProductName = tier.name;
      orderProductCode = tier.code;
      amount = Number(tier.price) || 0;
      bundleItemsJson = JSON.stringify(items);
    } else {
      if (!orderProductId) return NextResponse.json({ error: "Produk wajib dipilih." }, { status: 400 });
      const product = await ProductModel.findById(orderProductId);
      if (!product) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
      if (!product.available) return NextResponse.json({ error: "Produk saat ini belum tersedia." }, { status: 400 });

      orderProductName = product.name;
      orderProductCode = product.code;
      amount = Number(product.price) || 0;
    }

    const orderId = "LUMA-" + Date.now().toString(36).toUpperCase() + "-" + crypto.randomBytes(2).toString("hex").toUpperCase();
    const origin = req.headers.get("origin") || config.appUrl;
    const finishUrl = `${origin.replace(/\/$/, "")}/?paid=true&orderId=${encodeURIComponent(orderId)}`;

    let snapToken = null;
    let redirectUrl = null;

    try {
      const snapRes = await MidtransService.createTransaction({
        orderId,
        amount,
        customer: { name, email, phone },
        item: { id: orderProductId, code: orderProductCode, name: orderProductName },
        finishUrl
      });
      snapToken = snapRes.snapToken;
      redirectUrl = snapRes.redirectUrl;
    } catch (err) {
      console.error("[Next.js Order API] Midtrans Error:", err.message);
      return NextResponse.json({ error: "Gagal membuat transaksi pembayaran Midtrans." }, { status: 502 });
    }

    const createdAt = new Date().toISOString();
    await OrderModel.create({
      id: orderId,
      product_id: orderProductId,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      amount,
      status: "PENDING",
      midtrans_snap_token: snapToken,
      midtrans_redirect_url: redirectUrl,
      bundle_items: bundleItemsJson,
      created_at: createdAt
    });

    return NextResponse.json({
      orderId,
      productId: orderProductId,
      productName: orderProductName,
      productCode: orderProductCode,
      amount,
      status: "PENDING",
      snapToken,
      redirectUrl,
      createdAt,
      expiresAt: MidtransService.getExpiresAt(createdAt),
      expiryMinutes: MidtransService.getExpiryMinutes()
    }, { status: 201 });
  } catch (err) {
    console.error("[Order API Error]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
