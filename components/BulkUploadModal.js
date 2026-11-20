"use client";

import { useState } from "react";

const BulkUploadModal = ({ token, onClose, onSaved }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleBulkUpload = async () => {
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API}/api/products/bulk`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Gagal mengunggah");
      }

      setImportResult(result);
      onSaved();
    } catch (err) {
      console.error("Bulk upload error:", err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580, padding: 24 }}>
        <div className="modal-header">
          <h2>Bulk Upload Preset</h2>
          <button className="btn-icon" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ color: "var(--text-3)", fontSize: 14 }}>
            Unggah file CSV dengan header: code,name,category,price,available
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <button type="button" className="btn btn-outline" onClick={() => document.querySelector('input[type="file"]').click()}>
              📁 Pilih File CSV
            </button>
          </div>
          {file && (
            <div style={{ background: "var(--bg-2)", padding: 12, borderRadius: 8 }}>
              <p style={{ margin: 0, color: "var(--text-2)" }}>File terpilih: {file.name}</p>
            </div>
          )}
          {importResult && (
            <div style={{
              marginTop: 16,
              padding: 16,
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid var(--success)",
              borderRadius: 8,
            }}>
              <h3 style={{ color: "var(--success)", margin: 0, fontSize: 14 }}>
                ✓ Import Sukses!
              </h3>
              <p style={{ margin: "8px 0 0", color: "var(--text-2)", fontSize: 13 }}>
                {importResult.successes} succeeded, {importResult.failed} failed from {importResult.total} products
              </p>
            </div>
          )}
          {importing && (
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <span className="spinner" />
              <span style={{ marginLeft: 8, color: "var(--text-3)" }}>Sedang mengunggah...</span>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Batal</button>
          <button type="button" className="btn btn-primary" disabled={importing} onClick={handleBulkUpload}>
            {importing ? "Sedang Mengunggah..." : "Unggah Produk"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;