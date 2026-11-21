import crypto from "node:crypto";
import { config } from "../config/env.js";

const SNAP_URL = config.midtrans.isProduction
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

function wibTimestamp(date = new Date()) {
  const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const pad = (value) => String(value).padStart(2, "0");
  return `${wib.getUTCFullYear()}-${pad(wib.getUTCMonth() + 1)}-${pad(wib.getUTCDate())} ${pad(wib.getUTCHours())}:${pad(wib.getUTCMinutes())}:${pad(wib.getUTCSeconds())} +0700`;
}

export const MidtransService = {
  getConfig() {
    return {
      clientKey: config.midtrans.clientKey,
      isProduction: config.midtrans.isProduction,
      expiryMinutes: config.midtrans.expiryMinutes
    };
  },

  getExpiryMinutes() {
    return config.midtrans.expiryMinutes;
  },

  getExpiresAt(createdAt) {
    const base = createdAt ? new Date(createdAt).getTime() : Date.now();
    const safeBase = Number.isFinite(base) ? base : Date.now();
    return new Date(safeBase + config.midtrans.expiryMinutes * 60 * 1000).toISOString();
  },

  verifySignature({ order_id, status_code, gross_amount, signature_key }) {
    const key = config.midtrans.signatureKey || config.midtrans.serverKey;
    if (!key) return true;
    const raw = `${order_id}${status_code}${gross_amount}${key}`;
    const computed = crypto.createHash("sha512").update(raw).digest("hex");
    return computed === signature_key;
  },

  async createTransaction({ orderId, amount, customer, item, finishUrl }) {
    if (!config.midtrans.serverKey) {
      return {
        snapToken: "demo_" + crypto.randomBytes(8).toString("hex"),
        redirectUrl: `${finishUrl}&demo=1`
      };
    }

    const auth = Buffer.from(config.midtrans.serverKey + ":").toString("base64");
    const customerDetails = {
      first_name: customer.name,
      phone: customer.phone
    };
    if (customer.email) customerDetails.email = customer.email;

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      customer_details: customerDetails,
      item_details: [{
        id: item.id,
        price: amount,
        quantity: 1,
        name: `${item.code} ${item.name}`.slice(0, 50)
      }],
      callbacks: {
        finish: finishUrl
      },
      expiry: {
        start_time: wibTimestamp(),
        unit: "minutes",
        duration: config.midtrans.expiryMinutes
      }
    };

    const res = await fetch(SNAP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${auth}`
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok || !data.token) {
      console.error("[Midtrans Service] Snap Error:", data);
      throw new Error(data.message || data.error || "Gagal membuat transaksi Midtrans");
    }

    return {
      snapToken: data.token,
      redirectUrl: data.redirect_url
    };
  },

  async checkTransactionStatus(orderId) {
    if (!config.midtrans.serverKey) return null;
    const auth = Buffer.from(config.midtrans.serverKey + ":").toString("base64");
    const baseUrl = config.midtrans.isProduction
      ? "https://api.midtrans.com/v2"
      : "https://api.sandbox.midtrans.com/v2";

    try {
      const res = await fetch(`${baseUrl}/${orderId}/status`, {
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${auth}`
        }
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("[Midtrans Service] Check status error:", err.message);
      return null;
    }
  }
};
