"use client";

import { useMemo, useRef, useState } from "react";

const TEMPLATE_HEADERS = [
  "code",
  "name",
  "subtitle",
  "category",
  "price",
  "available",
  "status",
  "description",
  "image"
];

const TEMPLATE_ROWS = [
  ["LP01", "Golden Tokyo Street", "Warm sunset tones", "Aesthetic", "29000", "true", "AVAILABLE", "Cocok untuk foto outdoor golden hour", "https://images.unsplash.com/photo-1234567890"],
  ["LP02", "Dark Moody Portrait", "Deep shadows and high contrast", "Moody", "35000", "false", "INACTIVE", "Untuk studio portrait cinematic", "https://images.unsplash.com/photo-2345678901"]
];

function formatSize(bytes) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPresetFile(file) {
  return /\.(xmp|zip|dng)$/i.test(file?.name || "");
}

export default function BulkUploadModal({ token, onClose, onSaved }) {
  const csvInputRef = useRef(null);
  const presetInputRef = useRef(null);
  const [mode, setMode] = useState("auto");
  const [csvFile, setCsvFile] = useState(null);
  const [presetFiles, setPresetFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const totalSize = useMemo(
    () => presetFiles.reduce((sum, file) => sum + file.size, 0),
    [presetFiles]
  );

  const addPresetFiles = (fileList) => {
    const incoming = Array.from(fileList || []).filter(isPresetFile);
    if (incoming.length === 0) return;

    setPresetFiles((previous) => {
      const map = new Map(previous.map((file) => [`${file.name}:${file.size}`, file]));
      incoming.forEach((file) => map.set(`${file.name}:${file.size}`, file));
      return Array.from(map.values());
    });
    setResult(null);
  };

  const removePresetFile = (name, size) => {
    setPresetFiles((previous) => previous.filter((file) => !(file.name === name && file.size === size)));
  };

  const downloadTemplate = () => {
    const lines = [TEMPLATE_HEADERS.join(","), ...TEMPLATE_ROWS.map((row) => row.map((cell) => `"${cell}"`).join(","))];
    const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "luma-bulk-upload-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (mode === "csv" && !csvFile) {
      setError("Pilih file CSV terlebih dahulu, atau gunakan mode otomatis dari nama file.");
      return;
    }
    if (mode === "auto" && presetFiles.length === 0) {
      setError("Pilih minimal satu file preset (.xmp/.zip/.dng).");
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setUploadPhase("uploading");
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      if (mode === "csv") formData.append("file", csvFile);
      presetFiles.forEach((file) => formData.append("presetFiles", file));

      const response = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/products/bulk");
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };
        xhr.upload.onload = () => {
          setUploadProgress(100);
          setUploadPhase("processing");
        };
        xhr.onload = () => {
          let data = {};
          try {
            data = JSON.parse(xhr.responseText || "{}");
          } catch {
            data = {};
          }
          resolve({ status: xhr.status, ok: xhr.status >= 200 && xhr.status < 300, data });
        };
        xhr.onerror = () => reject(new Error("Gagal terhubung ke server."));
        xhr.send(formData);
      });

      const data = response.data;
      if (response.status === 401) {
        throw new Error("Sesi login kedaluwarsa. Muat ulang halaman admin lalu login kembali.");
      }
      if (!response.ok) throw new Error(data.error || "Gagal mengimpor produk.");

      setResult(data);
      setUploadPhase("idle");
      if ((data.summary?.succeeded || 0) > 0) onSaved();
    } catch (err) {
      setError(err.message || "Gagal mengimpor produk.");
      setUploadPhase("idle");
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
      <div className="modal" style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <h2>Bulk Upload Produk</h2>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className={mode === "auto" ? "btn btn-primary" : "btn btn-outline"}
                onClick={() => {
                  setMode("auto");
                  setError("");
                }}
                style={{ flex: 1 }}
              >
                Otomatis dari Nama File
              </button>
              <button
                type="button"
                className={mode === "csv" ? "btn btn-primary" : "btn btn-outline"}
                onClick={() => {
                  setMode("csv");
                  setError("");
                }}
                style={{ flex: 1 }}
              >
                CSV + File Preset
              </button>
            </div>

            {mode === "auto" ? (
              <div className="alert alert-info" style={{ fontSize: 13 }}>
                Pilih banyak file preset sekaligus. Produk dibuat otomatis dari nama file.
                Contoh: <strong>LP01 Creamy.xmp</strong> → kode <strong>LP01</strong>, nama{" "}
                <strong>Creamy</strong>. Tidak perlu menyiapkan CSV.
                <div style={{ marginTop: 6 }}>
                  Punya banyak file? Gabung jadi <strong>satu ZIP</strong> (boleh berisi CSV + banyak
                  preset), lalu upload ZIP-nya. ZIP akan diekstrak otomatis.
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ margin: 0, color: "var(--text-2)", fontSize: 13 }}>
                  CSV wajib memiliki kolom <strong>code</strong> dan <strong>name</strong>. Kolom lain
                  opsional. File preset dicocokkan otomatis berdasarkan awalan kode.
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => csvInputRef.current?.click()}
                  >
                    {csvFile ? csvFile.name : "Pilih File CSV"}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={downloadTemplate}>
                    Download Template CSV
                  </button>
                </div>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={(event) => {
                    setCsvFile(event.target.files?.[0] || null);
                    setResult(null);
                  }}
                />
              </div>
            )}

            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                File preset {mode === "csv" ? "(opsional)" : ""}
              </div>
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragActive(false);
                  addPresetFiles(event.dataTransfer.files);
                }}
                onClick={() => presetInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? "var(--accent, #2563eb)" : "var(--border, #d1d5db)"}`,
                  borderRadius: 12,
                  padding: "24px 16px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: dragActive ? "var(--accent-bg, #eff6ff)" : "transparent"
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  Tarik & lepas file preset di sini
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                  atau klik untuk memilih banyak file .xmp / .zip / .dng sekaligus.
                  Satu ZIP berisi banyak preset + CSV juga didukung.
                </div>
              </div>
              <input
                ref={presetInputRef}
                type="file"
                accept=".xmp,.zip,.dng,application/zip,application/rdf+xml,text/xml"
                multiple
                hidden
                onChange={(event) => {
                  addPresetFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </div>

            {presetFiles.length > 0 && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                    fontSize: 12
                  }}
                >
                  <span style={{ color: "var(--success)", fontWeight: 600 }}>
                    {presetFiles.length} file dipilih ({formatSize(totalSize)})
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ padding: "2px 8px", fontSize: 11 }}
                    onClick={() => setPresetFiles([])}
                  >
                    Hapus semua
                  </button>
                </div>
                <div
                  style={{
                    maxHeight: 140,
                    overflowY: "auto",
                    border: "1px solid var(--border, #e5e7eb)",
                    borderRadius: 8,
                    padding: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4
                  }}
                >
                  {presetFiles.map((file) => (
                    <div
                      key={`${file.name}:${file.size}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        fontSize: 12
                      }}
                    >
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {file.name}
                      </span>
                      <span style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                        <span style={{ color: "var(--text-3)" }}>{formatSize(file.size)}</span>
                        <button
                          type="button"
                          onClick={() => removePresetFile(file.name, file.size)}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "var(--error, #dc2626)",
                            cursor: "pointer",
                            padding: 0
                          }}
                          aria-label={`Hapus ${file.name}`}
                        >
                          ×
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(loading || uploadPhase === "processing") && (
              <div style={{ border: "1px solid var(--border, #e5e7eb)", borderRadius: 10, padding: 12, background: "var(--bg-surface, #fff)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: "var(--text)" }}>
                    {uploadPhase === "processing" ? "Memproses & menyimpan di server..." : "Mengunggah file..."}
                  </span>
                  <span style={{ color: "var(--text-2)" }}>
                    {uploadPhase === "processing" ? "100%" : `${uploadProgress}%`}
                  </span>
                </div>
                <div style={{ height: 10, borderRadius: 999, background: "var(--bg-2, #e5e7eb)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: uploadPhase === "processing" ? "100%" : `${uploadProgress}%`,
                      background: "linear-gradient(90deg,#4f46e5,#7c3aed)",
                      transition: "width 0.2s ease"
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6 }}>
                  {uploadPhase === "processing"
                    ? "Upload selesai. Server sedang mengekstrak dan menyimpan produk, mohon tunggu..."
                    : `Mengirim ${formatSize(totalSize)} ke server.`}
                </div>
              </div>
            )}

            {result && (
              <div className="alert alert-success" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <strong>Import selesai.</strong>
                <span>
                  Berhasil {result.summary?.succeeded ?? 0} dari {result.summary?.total ?? 0} produk
                  {" "}(baru: {result.summary?.created ?? 0}, update: {result.summary?.updated ?? 0},
                  gagal: {result.summary?.failed ?? 0}).
                </span>
                {result.summary?.filesUploaded > 0 && (
                  <span style={{ fontSize: 12 }}>
                    File cocok: {result.summary?.filesMatched ?? 0}/
                    {result.summary?.filesUploaded ?? 0}
                  </span>
                )}
                {result.unmatchedFiles?.length > 0 && (
                  <span style={{ fontSize: 12, color: "var(--error, #dc2626)" }}>
                    File tidak cocok dengan kode produk: {result.unmatchedFiles.slice(0, 8).join(", ")}
                    {result.unmatchedFiles.length > 8 ? `, +${result.unmatchedFiles.length - 8} lagi` : ""}
                  </span>
                )}
                {result.withoutFile?.length > 0 && (
                  <span style={{ fontSize: 12, color: "var(--error, #dc2626)" }}>
                    Produk tanpa file: {result.withoutFile.slice(0, 8).join(", ")}
                    {result.withoutFile.length > 8 ? `, +${result.withoutFile.length - 8} lagi` : ""}
                  </span>
                )}
                {result.errors?.length > 0 && (
                  <div style={{ fontSize: 12, color: "var(--error, #dc2626)" }}>
                    {result.errors.slice(0, 5).map((item, index) => (
                      <div key={index}>
                        Baris {item.line ?? item.index + 2}: {item.error}
                      </div>
                    ))}
                    {result.errors.length > 5 && <div>+{result.errors.length - 5} error lagi</div>}
                  </div>
                )}
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
              disabled={loading || (mode === "csv" ? !csvFile : presetFiles.length === 0)}
            >
              {loading ? (
                <span className="spinner" />
              ) : mode === "auto" ? (
                `Import ${presetFiles.length} Produk`
              ) : presetFiles.length > 0 ? (
                `Import CSV + ${presetFiles.length} File`
              ) : (
                "Import CSV"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
