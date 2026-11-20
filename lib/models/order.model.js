import { query } from "../config/database.js";

export const OrderModel = {
  async findById(id) {
    const { rows } = await query("SELECT * FROM orders WHERE id = $1 LIMIT 1", [id]);
    return rows[0] || null;
  },

  async create(orderData) {
    const { rows } = await query(
      `INSERT INTO orders
         (id, product_id, customer_name, customer_email, customer_phone, amount, status,
          midtrans_snap_token, midtrans_redirect_url, bundle_items, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        orderData.id,
        orderData.product_id,
        orderData.customer_name,
        orderData.customer_email,
        orderData.customer_phone,
        orderData.amount,
        orderData.status,
        orderData.midtrans_snap_token,
        orderData.midtrans_redirect_url,
        orderData.bundle_items,
        orderData.created_at
      ]
    );
    return rows[0] || orderData;
  },

  async updateStatus(id, { status, accessCode, paidAt, paymentType, transactionId }) {
    const sets = ["status = $1"];
    const params = [status];

    if (accessCode !== undefined) {
      params.push(accessCode);
      sets.push(`access_code = $${params.length}`);
    }
    if (paidAt !== undefined) {
      params.push(paidAt);
      sets.push(`paid_at = $${params.length}`);
    }
    if (paymentType !== undefined) {
      params.push(paymentType);
      sets.push(`payment_type = $${params.length}`);
    }
    if (transactionId !== undefined) {
      params.push(transactionId);
      sets.push(`midtrans_transaction_id = $${params.length}`);
    }

    params.push(id);
    await query(`UPDATE orders SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
    return true;
  },

  async findByPhone(phone) {
    const { rows } = await query(
      `SELECT o.*, p.name AS product_name, p.code AS product_code, p.image AS product_image
       FROM orders o
       LEFT JOIN products p ON p.id = o.product_id
       WHERE o.customer_phone = $1
       ORDER BY o.created_at DESC
       LIMIT 20`,
      [phone]
    );

    return rows.map(({ product_name, product_code, product_image, ...order }) => ({
      ...order,
      products: product_name
        ? { name: product_name, code: product_code, image: product_image }
        : null
    }));
  },

  async findAll() {
    const { rows } = await query(
      `SELECT o.*, p.name AS product_name, p.code AS product_code, p.image AS product_image
       FROM orders o
       LEFT JOIN products p ON p.id = o.product_id
       ORDER BY o.created_at DESC
       LIMIT 200`
    );

    return rows.map(({ product_name, product_code, product_image, ...order }) => ({
      ...order,
      products: product_name
        ? { name: product_name, code: product_code, image: product_image }
        : null
    }));
  }
};
