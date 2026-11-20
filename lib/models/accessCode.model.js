import { query } from "../config/database.js";
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

    await query(
      `INSERT INTO access_codes
         (code, product_id, order_id, used, downloads_count, bundle_items, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        row.code,
        row.product_id,
        row.order_id,
        row.used,
        row.downloads_count,
        row.bundle_items,
        row.created_at
      ]
    );
    return row;
  },

  async findByCode(code) {
    const { rows } = await query("SELECT * FROM access_codes WHERE code = $1 LIMIT 1", [code]);
    return rows[0] || null;
  },

  async findByCodeAndProduct(code, productId) {
    const { rows } = await query(
      "SELECT * FROM access_codes WHERE code = $1 AND product_id = $2 LIMIT 1",
      [code, productId]
    );
    return rows[0] || null;
  },

  async incrementDownload(code) {
    const { rows } = await query(
      `UPDATE access_codes
       SET used = true,
           used_at = COALESCE(used_at, now()),
           downloads_count = COALESCE(downloads_count, 0) + 1
       WHERE code = $1
       RETURNING *`,
      [code]
    );
    return rows[0] || null;
  }
};
