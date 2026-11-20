import { db } from "../config/database.js";

export const OrderModel = {
  async findById(id) {
    const { data, error } = await db.from("orders").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;
    return data;
  },

  async create(orderData) {
    let res = await db.from("orders").insert(orderData);
    if (res.error && (res.error.message?.includes("bundle_items") || res.error.code === "42703" || res.error.code === "PGRST204")) {
      const { bundle_items, ...fallbackData } = orderData;
      res = await db.from("orders").insert(fallbackData);
    }
    if (res.error) throw new Error(res.error.message);
    return orderData;
  },

  async updateStatus(id, { status, accessCode, paidAt, paymentType, transactionId }) {
    const updates = { status };
    if (accessCode !== undefined) updates.access_code = accessCode;
    if (paidAt !== undefined) updates.paid_at = paidAt;
    if (paymentType !== undefined) updates.payment_type = paymentType;
    if (transactionId !== undefined) updates.midtrans_transaction_id = transactionId;

    const { error } = await db.from("orders").update(updates).eq("id", id);
    if (error) throw new Error(error.message);
    return true;
  },

  async findAll() {
    try {
      const { data, error } = await db
        .from("orders")
        .select("*, products(name, code, image)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!error && data) return data;
    } catch (_) {}

    try {
      const { data } = await db.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
      return data || [];
    } catch (e) {
      return [];
    }
  }
};
