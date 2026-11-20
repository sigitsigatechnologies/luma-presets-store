"use client";

import { useState } from "react";
import { CheckIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

export default function PaymentSuccessModal({ order, onClose, onDownload }) {
  const [copied, setCopied] = useState(false);
  const price = typeof order?.amount === "number" ? order.amount : Number(order?.amount) || 0;
  const accessCode = order?.accessCode || "";

  const handleCopy = () => {
    if (!accessCode) return;
    navigator.clipboard.writeText(accessCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460, overflow: "hidden", borderRadius: 16 }}>
        {/* Decorative Top Accent Banner */}
        <div style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          padding: "28px 24px 20px",
          textAlign: "center",
          color: "#ffffff",
          position: "relative"
        }}>
          <div style={{
            width: 58, height: 58, borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.2)",
            backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px",
            boxShadow: "0 8px 16px rgba(0,0,0,0.15)"
          }}>
            <CheckIcon className="h-8 w-8 text-white" strokeWidth={3} aria-hidden="true" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
            Pembayaran Berhasil!
          </h2>
          <p style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
            Terima kasih, <strong>{order?.customerName || "Kreator"}</strong>. Pesananmu telah aktif.
          </p>
        </div>

        <div className="modal-body" style={{ padding: "24px" }}>
          {/* Product & Order Info */}
          <div style={{
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 16
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                ID Pesanan
              </span>
              <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                {order?.orderId}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
                {order?.productName || "Koleksi Preset Lightroom"}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>
                Rp {price.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Access Code Box */}
          <div style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(5, 150, 105, 0.02) 100%)",
            border: "1.5px dashed #10b981",
            borderRadius: 12,
            padding: "16px",
            textAlign: "center",
            marginBottom: 18
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#059669", marginBottom: 6 }}>
              🔑 Kode Akses Unduhan Kamu
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginTop: 4
            }}>
              <span style={{
                fontFamily: "monospace",
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "var(--text)"
              }}>
                {accessCode || "MEMPROSES..."}
              </span>
              {accessCode && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn btn-sm"
                  style={{
                    padding: "4px 10px",
                    fontSize: 12,
                    background: copied ? "#10b981" : "var(--bg)",
                    color: copied ? "#ffffff" : "var(--text)",
                    border: "1px solid var(--border)",
                    borderRadius: 6
                  }}
                >
                  {copied ? "✓ Tersalin!" : "Salin"}
                </button>
              )}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>
              Simpan kode ini untuk mengunduh preset kapan saja tanpa batas waktu.
            </div>
          </div>

          {/* WhatsApp status note */}
          {order?.customerPhone && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              background: "rgba(37, 211, 102, 0.08)",
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 12,
              color: "#15803d"
            }}>
              <ChatBubbleLeftRightIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span>Kode akses & link unduhan juga telah dikirim ke WhatsApp <strong>{order.customerPhone}</strong>.</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              className="btn btn-primary btn-lg"
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #111111 0%, #1f2937 100%)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}
              onClick={() => onDownload(accessCode)}
            >
              Unduh Preset Sekarang →
            </button>
            <button
              className="btn btn-outline"
              style={{ width: "100%" }}
              onClick={onClose}
            >
              Tutup & Kembali Belanja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
