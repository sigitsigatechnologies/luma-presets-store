const HEADER_ALIASES = {
  kode: "code",
  id_produk: "code",
  nama: "name",
  nama_produk: "name",
  subjudul: "subtitle",
  kategori: "category",
  harga: "price",
  tersedia: "available",
  aktif: "available",
  deskripsi: "description",
  gambar: "image",
  foto: "image",
  berkas: "file",
  nama_file: "file",
  filename: "file"
};

const TRUE_VALUES = new Set(["true", "1", "yes", "y", "ya", "aktif", "active", "available", "tersedia"]);
const FALSE_VALUES = new Set(["false", "0", "no", "n", "tidak", "nonaktif", "inactive", "unavailable", "habis"]);

export function normalizeHeader(header) {
  const key = String(header ?? "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
  return HEADER_ALIASES[key] || key;
}

export function normalizeRow(row) {
  const output = {};
  for (const [key, value] of Object.entries(row || {})) {
    output[normalizeHeader(key)] = typeof value === "string" ? value.trim() : value;
  }
  return output;
}

export function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return fallback;
}

export function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim() !== "") || "";
  const counts = { ",": 0, ";": 0, "\t": 0 };
  let quoted = false;

  for (let i = 0; i < firstLine.length; i += 1) {
    const char = firstLine[i];
    if (char === '"') {
      if (quoted && firstLine[i + 1] === '"') i += 1;
      else quoted = !quoted;
    } else if (!quoted && char in counts) {
      counts[char] += 1;
    }
  }

  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

export function parseCsv(input) {
  const text = String(input ?? "").replace(/^\uFEFF/, "");
  if (!text.trim()) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(text);
  const matrix = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(value);
      value = "";
      if (row.some((cell) => String(cell).trim() !== "")) matrix.push(row);
      row = [];
    } else {
      value += char;
    }
  }

  row.push(value);
  if (row.some((cell) => String(cell).trim() !== "")) matrix.push(row);

  if (matrix.length === 0) return { headers: [], rows: [] };

  const seenHeaders = new Set();
  const headers = matrix[0].map((header) => {
    const normalized = normalizeHeader(header);
    let unique = normalized || "column";
    let suffix = 2;
    while (seenHeaders.has(unique)) {
      unique = `${normalized}_${suffix}`;
      suffix += 1;
    }
    seenHeaders.add(unique);
    return unique;
  });

  const rows = matrix.slice(1).map((values) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = String(values[index] ?? "").trim();
    });
    return item;
  });

  return { headers, rows };
}

export const CSV_TEMPLATE_HEADERS = [
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
