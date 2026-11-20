"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./CheckoutModal.module.css";

const API = "";

const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
const IS_PRODUCTION = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

function cleanupMidtransDom() {
  try {
    if (window.snap && typeof window.snap.hide === "function") {
      window.snap.hide();
    }
  } catch (e) {}

  const selectors = [
    "#snap-midtrans",
    "#snap-container",
    ".snap-overlay",
    "iframe[src*='midtrans']",
    "iframe[name*='popup_']"
  ];
  selectors.forEach((sel) => {
    document.querySelectorAll(sel).forEach((el) => {
      try {
        el.remove();
      } catch (e) {}
    });
  });

  try {
    document.body.style.overflow = "";
  } catch (e) {}
}

function loadMidtransSnap(onLoaded) {
  const snap_url = IS_PRODUCTION
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  if (window.snap) return onLoaded();

  const script = document.createElement("script");
  script.src = snap_url;
  script.setAttribute("data-client-key", MIDTRANS_CLIENT_KEY);
  script.onload = onLoaded;
  document.head.appendChild(script);
}

export default function CheckoutModal({ product, bundleTier, products = [], onClose, onSuccess }) {
  const isBundle = !!bundleTier;
  const [step, setStep] = useState(isBundle ? "select" : "form"); // "select" | "form" | "waiting"
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm] = useState({ name: "", phone: "", email: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null); // { orderId, snapToken }

  const pollIntervalRef = useRef(null);

  const maxSelect = bundleTier?.id === "bundle-all" ? Infinity : (bundleTier?.presetCount || 0);
  const price = isBundle
    ? (typeof bundleTier.price === "number" ? bundleTier.price : Number(bundleTier.price) || 0)
    : (typeof product?.price === "number" ? product.price : Number(product?.price) || 0);

  // Stop polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const checkOrderStatus = async (orderId, fallbackData = null) => {
    setCheckingPayment(true);
    try {
      const res = await fetch(`${API}/api/orders/${orderId}/check-status`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "PAID") {
          stopPolling();
          cleanupMidtransDom();
          onSuccess(data);
          return true;
        }
      }
    } catch (err) {
      console.error("Gagal memeriksa status pembayaran:", err);
    } finally {
      setCheckingPayment(false);
    }
    return false;
  };

  const startAutoCheck = (orderId, baseOrder) => {
    stopPolling();
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/orders/${orderId}/check-status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "PAID") {
            stopPolling();
            cleanupMidtransDom();
            onSuccess(data);
          }
        }
      } catch (err) {
        console.error("Auto check error:", err);
      }
    }, 2500);
  };

  const openSnapPopup = (token, orderId, baseOrder) => {
    loadMidtransSnap(() => {
      setLoading(false);
      startAutoCheck(orderId, baseOrder);

      window.snap?.pay(token, {
        onSuccess: async (result) => {
          stopPolling();
          cleanupMidtransDom();
          // Check backend / simulate to guarantee status & access code
          let confirmedData = null;
          try {
            const res = await fetch(`${API}/api/orders/${orderId}/check-status`);
            if (res.ok) {
              const d = await res.json();
              if (d.status === "PAID") confirmedData = d;
            }
            if (!confirmedData) {
              const simRes = await fetch(`${API}/api/orders/simulate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
              });
              const simJson = await simRes.json();
              if (simRes.ok && !simJson.error) {
                confirmedData = simJson;
              }
            }
          } catch (e) {
            console.error("Simulate error on success:", e);
          }

          onSuccess(confirmedData || { ...baseOrder, status: "PAID", accessCode: result.order_id });
        },
        onPending: async () => {
          setStep("waiting");
          startAutoCheck(orderId, baseOrder);
        },
        onError: (err) => {
          setServerError("Pembayaran gagal atau dibatalkan oleh sistem Midtrans.");
          setStep("waiting");
        },
        onClose: async () => {
          // Check if user actually paid before dismissing
          const wasPaid = await checkOrderStatus(orderId, baseOrder);
          if (!wasPaid) {
            setStep("waiting");
            // Keep background polling in case user paid via mobile QRIS
            startAutoCheck(orderId, baseOrder);
          }
        },
      });
    });
  };

  const handleSimulatePayment = async () => {
    if (!activeOrder?.orderId) return;
    setLoading(true);
    setServerError("");
    try {
      const res = await fetch(`${API}/api/orders/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: activeOrder.orderId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setServerError(data.error || "Gagal melakukan simulasi pembayaran.");
        return;
      }
      stopPolling();
      cleanupMidtransDom();
      onSuccess(data);
    } catch (err) {
      setServerError("Gagal melakukan simulasi pembayaran.");
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (bundleTier?.id !== "bundle-all" && prev.length >= maxSelect) return prev;
      return [...prev, id];
    });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Nama wajib diisi";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 9) e.phone = "Nomor WhatsApp tidak valid (min 9 digit)";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Email tidak valid";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setServerError("");

    try {
      const body = {
        customerName: form.name.trim(),
        customerPhone: form.phone.trim(),
        customerEmail: form.email.trim(),
      };

      if (isBundle) {
        body.bundleTier = bundleTier.id;
        body.selectedProductIds = bundleTier.id === "bundle-all" ? [] : selectedIds;
      } else {
        body.productId = product.id;
      }

      const res = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Terjadi kesalahan. Coba lagi.");
        setLoading(false);
        return;
      }

      setActiveOrder({
        orderId: data.orderId,
        snapToken: data.snapToken,
        amount: price,
        customerName: form.name,
        customerPhone: form.phone,
        productName: isBundle ? bundleTier.name : product?.name
      });

      // Try Midtrans Snap
      if (data.snapToken) {
        openSnapPopup(data.snapToken, data.orderId, data);
        return;
      }

      // Fallback: redirect
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      setServerError("Tidak mendapat token pembayaran.");
      setLoading(false);
    } catch (err) {
      setServerError("Gagal terhubung ke server. Pastikan server berjalan.");
      setLoading(false);
    }
  };

  const handleClose = () => {
    stopPolling();
    cleanupMidtransDom();
    onClose();
  };

  const productName = isBundle ? bundleTier.name : product?.name;
  const canProceed = !isBundle || bundleTier.id === "bundle-all" || selectedIds.length === maxSelect;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>
            {step === "waiting"
              ? "Status Pembayaran"
              : isBundle
              ? (step === "select" ? "Pilih Preset Bundle" : "Detail Pembelian")
              : "Checkout Preset"}
          </h2>
          <button className="btn-icon" onClick={handleClose} aria-label="Tutup">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Bundle product selection step */}
        {isBundle && step === "select" && (
          <div className="modal-body">
            <div className={styles.bundleSelectHeader}>
              <div>
                <strong>{bundleTier.name}</strong>
                <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}>
                  {bundleTier.id === "bundle-all"
                    ? "Semua preset akan disertakan otomatis."
                    : `Pilih tepat ${maxSelect} preset dari daftar berikut.`}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 17 }}>Rp {price.toLocaleString("id-ID")}</div>
                {bundleTier.id !== "bundle-all" && (
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{selectedIds.length}/{maxSelect} dipilih</div>
                )}
              </div>
            </div>

            {bundleTier.id !== "bundle-all" && (
              <div className={styles.productPickList}>
                {products.map((p) => {
                  const picked = selectedIds.includes(p.id);
                  const disabled = !picked && selectedIds.length >= maxSelect;
                  return (
                    <button
                      key={p.id}
                      className={`${styles.pickItem} ${picked ? styles.pickItemActive : ""} ${disabled ? styles.pickItemDisabled : ""}`}
                      onClick={() => !disabled && toggleProduct(p.id)}
                    >
                      <span className={styles.pickCheck}>{picked ? "✓" : ""}</span>
                      <span>{p.name}</span>
                      <span style={{ fontSize: 12, color: "var(--text-3)", marginLeft: "auto" }}>
                        Rp {(Number(p.price) || 0).toLocaleString("id-ID")}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="modal-footer" style={{ margin: "0 -24px -24px", borderTop: "1px solid var(--border)" }}>
              <button className="btn btn-outline" onClick={handleClose}>Batal</button>
              <button
                className="btn btn-primary"
                disabled={!canProceed}
                onClick={() => setStep("form")}
              >
                Lanjut ke Formulir →
              </button>
            </div>
          </div>
        )}

        {/* Form step */}
        {step === "form" && (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Order summary */}
              <div className={styles.orderSummary}>
                <div className={styles.summaryRow}>
                  <span>{productName}</span>
                  <span style={{ fontWeight: 600 }}>Rp {price.toLocaleString("id-ID")}</span>
                </div>
                {isBundle && bundleTier.id !== "bundle-all" && selectedIds.length > 0 && (
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
                    {selectedIds.length} preset pilihan
                  </div>
                )}
                <div className="divider" style={{ margin: "12px 0" }} />
                <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                  <span>Total Pembayaran</span>
                  <span style={{ color: "var(--accent-glow, #111)", fontSize: 18 }}>Rp {price.toLocaleString("id-ID")}</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 20 }}>
                <div className="form-group">
                  <label>Nama Lengkap</label>
                  <input
                    className={`form-control ${errors.name ? styles.inputError : ""}`}
                    placeholder="Nama kamu"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                  {errors.name && <span className={styles.errMsg}>{errors.name}</span>}
                </div>
                <div className="form-group">
                  <label>Nomor WhatsApp (Aktif untuk Pengiriman File)</label>
                  <input
                    className={`form-control ${errors.phone ? styles.inputError : ""}`}
                    placeholder="081234567890"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  {errors.phone && <span className={styles.errMsg}>{errors.phone}</span>}
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    className={`form-control ${errors.email ? styles.inputError : ""}`}
                    placeholder="nama@email.com"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  {errors.email && <span className={styles.errMsg}>{errors.email}</span>}
                </div>

                {serverError && (
                  <div className="alert alert-error">{serverError}</div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              {isBundle && (
                <button type="button" className="btn btn-outline" onClick={() => setStep("select")}>
                  ← Kembali
                </button>
              )}
              {!isBundle && (
                <button type="button" className="btn btn-outline" onClick={handleClose}>Batal</button>
              )}
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <><span className="spinner" /> Membuka Midtrans…</>
                ) : (
                  `Bayar Rp ${price.toLocaleString("id-ID")}`
                )}
              </button>
            </div>
          </form>
        )}

        {/* Waiting / Auto-Check Step */}
        {step === "waiting" && activeOrder && (
          <div className="modal-body" style={{ textAlign: "center", padding: "28px 24px" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "rgba(22, 163, 74, 0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <span className="spinner spinner-dark" style={{ width: 26, height: 26 }} />
            </div>

            <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 6 }}>
              Menunggu Pembayaran
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16 }}>
              Selesaikan pembayaran di popup Midtrans atau scan QRIS melalui m-Banking kamu.
              Sistem akan mendeteksi status secara otomatis.
            </p>

            <div style={{
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "14px 16px",
              textAlign: "left",
              marginBottom: 20
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--text-3)", marginBottom: 4 }}>
                <span>ID Pesanan</span>
                <span style={{ fontFamily: "monospace", color: "var(--text)" }}>{activeOrder.orderId}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600 }}>
                <span>Total</span>
                <span>Rp {Number(activeOrder.amount).toLocaleString("id-ID")}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--success)", marginTop: 10 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "var(--success)" }} />
                <span>Auto-check aktif (memeriksa setiap beberapa detik)</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => checkOrderStatus(activeOrder.orderId, activeOrder)}
                disabled={checkingPayment}
                style={{ width: "100%" }}
              >
                {checkingPayment ? <><span className="spinner" /> Memeriksa status…</> : "Cek Status Pembayaran ↻"}
              </button>

              <button
                className="btn btn-outline"
                onClick={() => openSnapPopup(activeOrder.snapToken, activeOrder.orderId, activeOrder)}
                style={{ width: "100%" }}
              >
                Buka Kembali Pop-Up Midtrans
              </button>

              <button
                type="button"
                className="btn"
                onClick={handleSimulatePayment}
                disabled={loading}
                style={{
                  width: "100%",
                  fontSize: 12,
                  color: "#6b7280",
                  background: "var(--bg-3)",
                  border: "1px dashed var(--border-2)"
                }}
              >
                {loading ? "Memproses…" : "⚡ Simulasi Bayar Berhasil (Sandbox Mode)"}
              </button>

              <button
                className="btn"
                onClick={handleClose}
                style={{ fontSize: 13, color: "var(--text-3)", marginTop: 4 }}
              >
                Tutup / Nanti Saja
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
