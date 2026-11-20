"use client";

import { useRef, useState } from "react";

export default function BulkUploadModal({ token, onClose, onSaved }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [presetFiles, setPresetFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Pilih file CSV terlebih dahulu.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      presetFiles.forEach((presetFile) => formData.append("presetFiles", presetFile));

      const response = await fetch("/api/products/bulk", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengimpor produk.");
      }

      setResult(data.summary || data);
      onSaved();
    } catch (err) {
      setError(err.message || "Gagal mengimpor produk.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <h2>Bulk Upload Produk</h2>
          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className="modal-body"
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <p style={{ margin: 0, color: "var(--text-2)", fontSize: 13 }}>
              Upload CSV dengan kolom wajib <strong>code</strong> dan{" "}
              <strong>name</strong>. Kolom lain bersifat opsional.
            </p>

            <button
              type="button"
              className="btn btn-outline"
              onClick={() => inputRef.current?.click()}
            >
              {file ? file.name : "Pilih File CSV"}
            </button>

            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />

            <label style={{ fontSize: 13, fontWeight: 600 }}>File preset berdasarkan kode produk</label>
            <input
              type="file"
              accept=".xmp,.zip,.dng,application/zip,text/xml"
              multiple
              onChange={(event) => setPresetFiles(Array.from(event.target.files || []))}
            />
            {presetFiles.length > 0 && (
              <small style={{ color: "var(--success)" }}>
                {presetFiles.length} file preset dipilih
              </small>
            )}

            <small style={{ color: "var(--text-3)" }}>
              Nama file harus diawali kode CSV, contoh: LP01.xmp atau LP01.zip.
              Format CSV: code,name,subtitle,category,price,available,status,description,image.
            </small>

            {result && (
              <div className="alert alert-success">
                Import selesai. Berhasil: {result.succeeded ?? result.success ?? 0},
                gagal: {result.failed ?? 0}, total: {result.total ?? 0}.
              </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !file}
            >
              {loading ? <span className="spinner" /> : "Import Produk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}