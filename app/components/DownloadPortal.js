"use client";

import { useState, useEffect } from "react";

const API = "";

export default function DownloadPortal({ initialCode = "", onClose }) {
  const [code, setCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    if (initialCode) {
      validateCode(initialCode);
    }
  }, [initialCode]);

  const validateCode = async (codeToVerify) => {
    const trimmed = (codeToVerify || "").trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch(`${API}/api/download/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Kode tidak valid.");
      } else {
        setResult(data);
      }
    } catch (err) {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (e) => {
    e.preventDefault();
    validateCode(code);
  };

  const handleDownload = async (productId = null) => {
    const key = productId || "main";
    setDownloading(key);
    try {
      let url = `${API}/api/download/file?code=${encodeURIComponent(code.trim().toUpperCase())}`;
      if (productId) url += `&productId=${encodeURIComponent(productId)}`;
      window.location.href = url;
      setTimeout(() => setDownloading(null), 3000);
    } catch {
      setDownloading(null);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h2>Download Preset</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Tutup">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {!result ? (
            <form onSubmit={handleValidate}>
              <p style={{ fontSize: 14, color: "var(--text-2)", marginBottom: 16 }}>
                Masukkan kode akses yang dikirim ke WhatsApp setelah pembayaran berhasil.
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="form-control"
                  placeholder="LUMA-XXXXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  style={{ flex: 1, fontFamily: "monospace", letterSpacing: "0.05em" }}
                />
                <button type="submit" className="btn btn-primary" disabled={loading || !code.trim()}>
                  {loading ? <span className="spinner" /> : "Cek"}
                </button>
              </div>
              {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}
            </form>
          ) : (
            <div>
              <div className="alert alert-success" style={{ marginBottom: 20 }}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Kode valid! Siap diunduh.
              </div>

              <div style={{ padding: "16px", background: "var(--bg-2)", borderRadius: "var(--radius)", marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{result.product?.name}</div>
                <div style={{ fontSize: 13, color: "var(--text-3)" }}>
                  {result.isBundle ? `${result.bundleProducts?.length || 0} preset dalam bundle` : result.product?.subtitle}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>
                  Diunduh {result.downloadsCount || 0}×
                </div>
              </div>

              {result.isBundle ? (
                <div>
                  <button
                    className="btn btn-primary btn-lg"
                    style={{ width: "100%", marginBottom: 16 }}
                    onClick={() => handleDownload()}
                    disabled={downloading === "main"}
                  >
                    {downloading === "main" ? <><span className="spinner" /> Menyiapkan…</> : "⬇ Unduh Semua (Master ZIP)"}
                  </button>
                  <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 12 }}>Atau unduh per preset:</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {result.bundleProducts?.map((p) => (
                      <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius)", background: "var(--bg)" }}>
                        <span style={{ fontSize: 14 }}>{p.name}</span>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleDownload(p.id)}
                          disabled={downloading === p.id}
                        >
                          {downloading === p.id ? <span className="spinner spinner-dark" /> : "Unduh"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  className="btn btn-primary btn-lg"
                  style={{ width: "100%" }}
                  onClick={() => handleDownload()}
                  disabled={downloading === "main"}
                >
                  {downloading === "main" ? <><span className="spinner" /> Menyiapkan…</> : "⬇ Unduh Preset"}
                </button>
              )}

              <button
                className="btn btn-outline"
                style={{ width: "100%", marginTop: 12 }}
                onClick={() => { setResult(null); setCode(""); }}
              >
                Gunakan Kode Lain
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
