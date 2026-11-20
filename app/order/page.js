"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeftIcon, ExclamationCircleIcon, ClockIcon, CheckCircleIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import DownloadPortal from "../components/DownloadPortal";

const API = "";

function formatRp(n) {
  return "Rp " + Number(n || 0).toLocaleString("id-ID");
}

function statusLabel(s) {
  if (s === "PAID") return { text: "Lunas", color: "#16a34a", bg: "rgba(22,163,74,0.1)" };
  if (s === "FAILED") return { text: "Gagal/Kadaluarsa", color: "#dc2626", bg: "rgba(220,38,38,0.1)" };
  return { text: "Menunggu Pembayaran", color: "#d97706", bg: "rgba(217,119,6,0.1)" };
}

function failedReasonText(reason) {
  if (reason === "expire") return "Batas waktu pembayaran telah habis.";
  if (reason === "cancel") return "Pembayaran dibatalkan.";
  if (reason === "deny") return "Pembayaran ditolak.";
  return "Pembayaran tidak berhasil atau telah kedaluwarsa.";
}

function OrderContent() {
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState(null);

  const [focusOrder, setFocusOrder] = useState(null);
  const [focusError, setFocusError] = useState("");
  const [focusLoading, setFocusLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [downloadCode, setDownloadCode] = useState(null);

  const focusId = searchParams.get("orderId") || "";
  const pollRef = useRef(null);

  const fetchFocus = async (id, silent = false) => {
    if (!silent) {
      setFocusLoading(true);
      setFocusError("");
    }
    try {
      const res = await fetch(`${API}/api/orders/${encodeURIComponent(id)}/check-status`);
      const data = await res.json();
      if (res.ok) {
        setFocusOrder(data);
        setFocusError("");
      } else {
        setFocusOrder(null);
        setFocusError(data?.error || "Pesanan tidak ditemukan.");
      }
    } catch (_) {
      if (!silent) setFocusError("Gagal memuat detail pesanan. Coba lagi.");
    }
    if (!silent) setFocusLoading(false);
  };

  useEffect(() => {
    if (focusId) fetchFocus(focusId);
    else {
      setFocusOrder(null);
      setFocusError("");
    }
  }, [focusId]);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (focusId && focusOrder && focusOrder.status === "PENDING") {
      pollRef.current = setInterval(() => fetchFocus(focusId, true), 4000);
    }
    return () => pollRef.current && clearInterval(pollRef.current);
  }, [focusId, focusOrder?.status]);

  const manualCheck = async () => {
    if (!focusId) return;
    setChecking(true);
    await fetchFocus(focusId, true);
    setChecking(false);
  };

  const lookup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setOrders(null);
    try {
      const res = await fetch(`${API}/api/orders/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Gagal mencari pesanan.");
      else setOrders(data.orders || []);
    } catch (_) {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const card = {
    background: "var(--bg-surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: 18,
    marginBottom: 14,
    boxShadow: "var(--shadow-sm)"
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-surface)" }}>
        <div className="container flex items-center justify-between" style={{ padding: "14px 20px", gap: 12 }}>
          <a href="/" style={{ fontWeight: 800, fontSize: 18, color: "var(--text)", textDecoration: "none" }}>
            LUMA <span style={{ fontWeight: 500, color: "var(--text-3)" }}>Presets</span>
          </a>
          <a href="/" className="btn btn-outline btn-sm inline-flex items-center gap-1.5">
            <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" /> Kembali
          </a>
        </div>
      </header>

      <main className="container" style={{ maxWidth: 680, padding: "28px 20px 40px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.02em" }}>Cek Status Pesanan</h1>
        <p style={{ color: "var(--text-3)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
          Pantau status pembayaran dan unduh preset berdasarkan nomor WhatsApp atau ID pesanan kamu.
        </p>

        {focusId && (
          <section style={{ ...card, marginBottom: 20 }}>
            <div className="flex items-start justify-between gap-3 mb-3" style={{ flexWrap: "wrap" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                  Detail Pesanan
                </div>
                <div style={{ fontFamily: "monospace", fontWeight: 600, fontSize: 14, wordBreak: "break-all" }}>{focusId}</div>
              </div>
              {focusOrder && !focusError && (
                (() => {
                  const st = statusLabel(focusOrder.status);
                  return (
                    <span style={{ fontSize: 12, fontWeight: 600, color: st.color, background: st.bg, padding: "4px 10px", borderRadius: 999, flexShrink: 0 }}>
                      {st.text}
                    </span>
                  );
                })()
              )}
            </div>

            {focusLoading && !focusOrder && !focusError ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-3)", padding: "8px 0" }}>
                <span className="spinner spinner-dark" /> Memuat status pesanan…
              </div>
            ) : focusError ? (
              <div style={{ background: "var(--error-bg)", border: "1px solid #fecaca", borderRadius: "var(--radius)", padding: 14 }}>
                <div className="flex items-start gap-3">
                  <ExclamationCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div style={{ fontWeight: 600, color: "#b91c1c", marginBottom: 2 }}>Pesanan tidak ditemukan</div>
                    <div style={{ fontSize: 13, color: "#991b1b", lineHeight: 1.5 }}>
                      Periksa kembali ID pesanan, atau cari menggunakan nomor WhatsApp yang dipakai saat checkout di bawah.
                    </div>
                  </div>
                </div>
              </div>
            ) : focusOrder ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", marginBottom: 14 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{focusOrder.productName || "Preset"}</div>
                    <div style={{ fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>Total: <strong style={{ color: "var(--text)" }}>{formatRp(focusOrder.amount)}</strong></div>
                  </div>
                </div>

                {focusOrder.status === "PAID" ? (
                  <div style={{ background: "rgba(22,163,74,0.06)", border: "1px solid rgba(22,163,74,0.2)", borderRadius: "var(--radius)", padding: 16 }}>
                    <div className="flex items-center gap-2 mb-2" style={{ color: "#15803d", fontWeight: 600, fontSize: 14 }}>
                      <CheckCircleIcon className="h-5 w-5" aria-hidden="true" /> Pembayaran berhasil
                    </div>
                    <div style={{ fontSize: 12, color: "#15803d", fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Kode Akses</div>
                    <div style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, marginBottom: 12, wordBreak: "break-all" }}>{focusOrder.accessCode || "-"}</div>
                    <button className="btn btn-primary" onClick={() => setDownloadCode(focusOrder.accessCode || "")} disabled={!focusOrder.accessCode}>
                      Unduh Preset
                    </button>
                    <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 10 }}>Kode akses juga dikirim ke WhatsApp kamu.</div>
                  </div>
                ) : focusOrder.status === "FAILED" ? (
                  <div style={{ background: "var(--error-bg)", border: "1px solid #fecaca", borderRadius: "var(--radius)", padding: 16 }}>
                    <div className="flex items-start gap-3">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: "#b91c1c", marginBottom: 4 }}>Pembayaran gagal atau kedaluwarsa</div>
                        <p style={{ fontSize: 13, color: "#991b1b", lineHeight: 1.6, marginBottom: 12 }}>
                          {failedReasonText(focusOrder.reason)} Jika kamu belum membayar, silakan lakukan pemesanan ulang dari halaman produk.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <a href="/" className="btn btn-primary btn-sm">Pesan Ulang</a>
                          <a href="#cari" className="btn btn-outline btn-sm" onClick={(e) => { e.preventDefault(); document.getElementById("cari-pesanan")?.scrollIntoView({ behavior: "smooth" }); }}>Cari Pesanan Lain</a>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "var(--warning-bg)", border: "1px solid #fde68a", borderRadius: "var(--radius)", padding: 16 }}>
                    <div className="flex items-start gap-3">
                      <ClockIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: "#92400e", marginBottom: 4 }}>Menunggu pembayaran</div>
                        <p style={{ fontSize: 13, color: "#92400e", lineHeight: 1.6, marginBottom: 12 }}>
                          Selesaikan pembayaran sesuai metode yang dipilih. Jika batas waktu habis, status akan berubah menjadi gagal/kadaluarsa.
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button className="btn btn-outline btn-sm" onClick={manualCheck} disabled={checking}>
                            {checking ? <><span className="spinner spinner-dark" /> Memeriksa…</> : "Refresh Status"}
                          </button>
                          <span style={{ fontSize: 12, color: "var(--text-3)" }}>Auto-refresh aktif</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </section>
        )}

        <section style={card} id="cari-pesanan">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Cari dengan Nomor WhatsApp</h2>
          <form onSubmit={lookup} className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              className="form-control"
              placeholder="08xxxxxxxxxx"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ flex: 1, minWidth: 0 }}
            />
            <button className="btn btn-primary w-full sm:w-auto" type="submit" disabled={loading || phone.replace(/\D/g, "").length < 9}>
              {loading ? <span className="spinner" /> : "Cek"}
            </button>
          </form>
          {error && <div className="alert alert-error mb-3">{error}</div>}

          {orders && (
            orders.length === 0 ? (
              <div style={{ fontSize: 14, color: "var(--text-3)" }}>Belum ada pesanan untuk nomor ini.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {orders.map((o) => {
                  const st = statusLabel(o.status);
                  return (
                    <div key={o.orderId} style={{ border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 14, background: "var(--bg)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{o.productName}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: st.color, background: st.bg, padding: "2px 8px", borderRadius: 999 }}>{st.text}</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "monospace", marginBottom: 4, wordBreak: "break-all" }}>{o.orderId}</div>
                      <div style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 10 }}>{formatRp(o.amount)}</div>
                      <div className="flex flex-wrap gap-2">
                        <a className="btn btn-outline btn-sm" href={`/order?orderId=${encodeURIComponent(o.orderId)}`}>Detail</a>
                        {o.status === "PAID" && o.accessCode && (
                          <button className="btn btn-primary btn-sm" onClick={() => setDownloadCode(o.accessCode)}>Unduh</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </section>

        <section style={{ ...card, marginTop: 4 }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600 border border-green-100">
                <ChatBubbleLeftRightIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 3, color: "var(--text)" }}>Butuh bantuan? IT Helpdesk</h2>
                <p style={{ fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
                  Jika ada kendala pembayaran, status pesanan, atau unduhan, tim IT siap membantu melalui WhatsApp.
                </p>
              </div>
            </div>
            <a
              href="https://wa.me/6281519025792?text=Halo%20Tim%20IT%20Helpdesk%20LUMA%2C%20saya%20butuh%20bantuan%20terkait%20pesanan."
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary inline-flex items-center justify-center gap-2 w-full sm:w-auto whitespace-nowrap"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" aria-hidden="true" />
              Chat WhatsApp
            </a>
          </div>
        </section>
      </main>

      {downloadCode && (
        <DownloadPortal initialCode={downloadCode} onClose={() => setDownloadCode(null)} />
      )}
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>Memuat pesanan…</div>}>
      <OrderContent />
    </Suspense>
  );
}
