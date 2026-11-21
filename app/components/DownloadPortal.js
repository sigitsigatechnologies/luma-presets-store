"use client";

import { useState, useEffect } from "react";
import { XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

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
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
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
                <CheckCircleIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
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
                    {downloading === "main" ? <><span className="spinner" /> Menyiapkan…</> : "Unduh Semua (Master ZIP)"}
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
                  {downloading === "main" ? <><span className="spinner" /> Menyiapkan…</> : "Unduh Preset"}
                </button>
              )}

              <details
                style={{
                  marginTop: 16,
                  padding: "12px 14px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  background: "var(--bg-2)",
                  fontSize: 13,
                  color: "var(--text-2)"
                }}
              >
                <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--text)" }}>
                  Cara import preset ke Lightroom
                </summary>
                <ol style={{ margin: "10px 0 0", paddingLeft: 18, lineHeight: 1.7 }}>
                  <li>Download file <strong>.zip</strong>, lalu ekstrak di aplikasi Files (iPhone) atau My Files (Android).</li>
                  <li>Buka Adobe Lightroom, pilih foto, lalu buka menu <strong>Presets</strong>.</li>
                  <li>Tap ikon titik tiga (<strong>...</strong>) &rarr; <strong>Import Presets</strong>.</li>
                  <li>Pilih file <strong>.xmp</strong> hasil ekstrak. Preset siap dipakai.</li>
                </ol>
                <p style={{ margin: "8px 0 0", color: "var(--text-3)" }}>
                  iPhone: jangan buka file .xmp langsung dari Files/WhatsApp — impor selalu dari dalam Lightroom.
                  Panduan lengkap juga sudah disertakan di dalam file .zip.
                </p>
              </details>

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
