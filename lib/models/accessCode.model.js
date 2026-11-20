import { db } from "../config/database.js";
import crypto from "node:crypto";

export function generateAccessCode() {
  return "LUMA-" + crypto.randomBytes(3).toString("hex").toUpperCase();
}

export const AccessCodeModel = {
  async create(code, productId, orderId = null, bundleItems = null) {
    const row = {
      code,
      product_id: productId,
      order_id: orderId,
      used: false,
      downloads_count: 0,
      bundle_items: bundleItems ? (typeof bundleItems === "string" ? bundleItems : JSON.stringify(bundleItems)) : null,
      created_at: new Date().toISOString()
    };
    let res = await db.from("access_codes").insert(row);
    if (res.error && (res.error.message?.includes("bundle_items") || res.error.code === "42703" || res.error.code === "PGRST204")) {
      const { bundle_items, ...fallbackRow } = row;
      res = await db.from("access_codes").insert(fallbackRow);
    }
    if (res.error) throw new Error(res.error.message);
    return row;
  },

  async findByCode(code) {
    const { data, error } = await db.from("access_codes").select("*").eq("code", code).maybeSingle();
    if (error || !data) return null;
    return data;
  },

  async findByCodeAndProduct(code, productId) {
    const { data, error } = await db
      .from("access_codes")
      .select("*")
      .eq("code", code)
      .eq("product_id", productId)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  },

  async incrementDownload(code) {
    const existing = await this.findByCode(code);
    if (!existing) return null;

    const updates = {
      used: true,
      used_at: existing.used_at || new Date().toISOString(),
      downloads_count: (existing.downloads_count || 0) + 1
    };

    await db.from("access_codes").update(updates).eq("code", code);
    return { ...existing, ...updates };
  }
};
