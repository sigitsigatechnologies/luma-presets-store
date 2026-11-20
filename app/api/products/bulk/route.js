import { NextResponse } from "next/server";
import { ProductModel } from "@/lib/models/product.model.js";
import { query } from "@/lib/config/database.js";
import { isAuthenticated } from "@/lib/auth.js";
import { CSV_TEMPLATE_HEADERS, normalizeRow, parseCsv, toBoolean } from "@/lib/utils/csv.js";
import { extractZipEntries } from "@/lib/utils/zip.js";
import { guessCategory, buildPresetImage } from "@/lib/utils/product-meta.js";

export const dynamic = "force-dynamic";

const PRESET_EXTENSIONS = new Set(["xmp", "zip", "dng"]);
const MIME_BY_EXTENSION = {
  xmp: "application/rdf+xml",
  zip: "application/zip",
  dng: "image/x-adobe-dng"
};

function toProductId(value) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeCode(value) {
  return String(value ?? "").trim().toUpperCase();
}

function getExtension(filename) {
  const parts = String(filename ?? "").split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function hasValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function looksLikeFileContent(value) {
  const text = String(value ?? "").trim();
  return text.startsWith("data:") || (text.length > 200 && /^[A-Za-z0-9+/=\s]+$/.test(text));
}

function guessNameFromFile(baseName) {
  const match = baseName.match(/^([A-Za-z0-9]+)[\s._-]+(.+)$/);
  if (match) {
    const code = normalizeCode(match[1]);
    const name = match[2].replace(/[._-]+/g, " ").replace(/\s+/g, " ").trim();
    return { code, name: name || code };
  }
  const code = normalizeCode(baseName);
  return { code, name: baseName };
}

function pathBaseName(filename) {
  return String(filename ?? "").split(/[\\/]/).pop();
}

function isJunkPath(filename) {
  const normalized = String(filename ?? "").replace(/\\/g, "/");
  const parts = normalized.split("/");
  const baseName = parts[parts.length - 1] || "";
  return (
    parts.includes("__MACOSX") ||
    baseName.startsWith("._") ||
    baseName === ".DS_Store" ||
    baseName === "Thumbs.db"
  );
}

function toPresetFile(filename, bytes) {
  const originalName = pathBaseName(filename);
  const extension = getExtension(originalName);
  if (!PRESET_EXTENSIONS.has(extension) || !bytes || bytes.length === 0) return null;

  const mime = MIME_BY_EXTENSION[extension] || "application/octet-stream";
  return {
    originalName,
    baseName: originalName.replace(/\.[^.]+$/, ""),
    extension,
    size: bytes.length,
    dataUri: `data:${mime};base64,${bytes.toString("base64")}`
  };
}

function isZipArchive(entries) {
  const cleanEntries = entries.filter((entry) => !isJunkPath(entry.filename));
  if (cleanEntries.length === 0) return false;
  const hasCsv = cleanEntries.some((entry) => getExtension(entry.filename) === "csv");
  const presetCount = cleanEntries.filter((entry) => PRESET_EXTENSIONS.has(getExtension(entry.filename))).length;
  return hasCsv || presetCount > 1;
}

function buildItem(raw, index) {
  const row = normalizeRow(raw);
  const code = normalizeCode(row.code || row.id);
  const name = String(row.name ?? "").trim();
  const id = hasValue(row.id) ? String(row.id).trim() : toProductId(code);

  if (!code) throw new Error("Kolom 'code' wajib diisi.");
  if (!name) throw new Error("Kolom 'name' wajib diisi.");

  const fields = { code, name };

  if (hasValue(row.subtitle)) fields.subtitle = String(row.subtitle).trim();
  if (hasValue(row.category)) fields.category = String(row.category).trim();
  if (hasValue(row.description)) fields.description = String(row.description).trim();
  if (hasValue(row.image)) fields.image = String(row.image).trim();
  if (hasValue(row.status)) fields.status = String(row.status).trim().toUpperCase();
  if (hasValue(row.available)) fields.available = toBoolean(row.available, true);
  if (hasValue(row.price)) {
    const price = Number(String(row.price).replace(/[^\d.-]/g, ""));
    fields.price = Number.isFinite(price) ? price : 0;
  }

  const fileValue = String(row.file ?? "").trim();
  return {
    index,
    line: index + 2,
    id,
    code,
    name,
    fields,
    fileRef: fileValue && !looksLikeFileContent(fileValue) ? fileValue : "",
    fileData: fileValue && looksLikeFileContent(fileValue) ? fileValue : ""
  };
}

function assignFiles(items, files) {
  const assigned = new Map();
  const used = new Set();

  for (const item of items) {
    if (!item.fileRef) continue;
    const ref = item.fileRef.toLowerCase();
    const match = files.find(
      (file) =>
        !used.has(file) &&
        (file.originalName.toLowerCase() === ref ||
          file.baseName.toLowerCase() === ref ||
          toProductId(file.baseName) === toProductId(ref))
    );
    if (match) {
      assigned.set(item.id, match);
      used.add(match);
    }
  }

  const sorted = [...items].sort((a, b) => b.id.length - a.id.length);
  for (const item of sorted) {
    if (assigned.has(item.id)) continue;
    const normalizedId = item.id.toLowerCase();

    const match = files.find((file) => {
      if (used.has(file)) return false;
      const baseName = file.baseName.toUpperCase();
      const normalizedFile = toProductId(file.baseName);
      return (
        baseName === item.code ||
        normalizedFile === normalizedId ||
        normalizedFile.startsWith(normalizedId)
      );
    });

    if (match) {
      assigned.set(item.id, match);
      used.add(match);
    }
  }

  return { assigned, used };
}

export async function POST(req) {
  try {
    if (!isAuthenticated(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let csvText = "";
    let rawItems = [];
    const presetFiles = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const csvFile = formData.get("file");
      if (csvFile && typeof csvFile.text === "function") {
        csvText = await csvFile.text();
      } else {
        const csvField = formData.get("csv");
        if (typeof csvField === "string") csvText = csvField;
      }

      const uploaded = [
        ...formData.getAll("presetFiles"),
        ...formData.getAll("presetFile"),
        ...formData.getAll("files")
      ];

      for (const file of uploaded) {
        if (!file || typeof file.arrayBuffer !== "function") continue;

        const originalName = String(file.name || "").trim();
        if (!originalName || isJunkPath(originalName)) continue;

        const extension = getExtension(originalName);
        const bytes = Buffer.from(await file.arrayBuffer());
        if (bytes.length === 0) continue;

        if (extension === "csv") {
          if (!csvText) csvText = bytes.toString("utf-8");
          continue;
        }

        if (extension === "zip") {
          const entries = extractZipEntries(bytes).filter((entry) => !isJunkPath(entry.filename));
          if (isZipArchive(entries)) {
            for (const entry of entries) {
              const entryExtension = getExtension(entry.filename);
              if (entryExtension === "csv") {
                if (!csvText) csvText = entry.content.toString("utf-8");
                continue;
              }
              const preset = toPresetFile(entry.filename, entry.content);
              if (preset) presetFiles.push(preset);
            }
            continue;
          }
        }

        const preset = toPresetFile(originalName, bytes);
        if (preset) presetFiles.push(preset);
      }
    } else {
      const body = await req.json();
      if (typeof body?.csv === "string") csvText = body.csv;
      if (Array.isArray(body?.products)) rawItems = body.products;
      else if (Array.isArray(body?.items)) rawItems = body.items;
    }

    const parsedCsv = csvText.trim() ? parseCsv(csvText) : { headers: [], rows: [] };

    if (rawItems.length === 0 && parsedCsv.rows.length > 0) {
      rawItems = parsedCsv.rows;
    }

    const autoMode = rawItems.length === 0 && presetFiles.length > 0;
    if (autoMode) {
      rawItems = presetFiles.map((file) => {
        const guessed = guessNameFromFile(file.baseName);
        return { code: guessed.code, name: guessed.name };
      });
    }

    if (rawItems.length === 0) {
      return NextResponse.json(
        {
          error:
            "Tidak ada produk untuk diimpor. Upload CSV, atau pilih minimal satu file preset (.xmp/.zip/.dng)."
        },
        { status: 400 }
      );
    }

    if (rawItems.length > 1000) {
      return NextResponse.json({ error: "Maksimal 1000 produk per upload." }, { status: 400 });
    }

    const items = [];
    const errors = [];
    const duplicateIds = new Set();

    rawItems.forEach((raw, index) => {
      try {
        const item = buildItem(raw, index);
        if (duplicateIds.has(item.id)) {
          throw new Error(`Kode/ID '${item.code}' duplikat di file upload.`);
        }
        duplicateIds.add(item.id);
        items.push(item);
      } catch (err) {
        errors.push({
          index,
          line: index + 2,
          error: err.message,
          item: raw
        });
      }
    });

    if (items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Semua baris gagal divalidasi. Periksa kolom code dan name.",
          summary: { total: rawItems.length, succeeded: 0, failed: errors.length },
          errors
        },
        { status: 400 }
      );
    }

    const { assigned, used } = assignFiles(items, presetFiles);
    const unmatchedFiles = presetFiles.filter((file) => !used.has(file)).map((file) => file.originalName);

    const ids = items.map((item) => item.id);
    const { rows: existingRows } = await query(
      `SELECT id, code, name, subtitle, category, price, status, available, description, image, file
       FROM products
       WHERE id = ANY($1::text[])`,
      [ids]
    );
    const existingMap = new Map(existingRows.map((row) => [row.id, row]));

    const results = [];
    let created = 0;
    let updated = 0;
    const withoutFile = [];

    for (const item of items) {
      try {
        const existing = existingMap.get(item.id);
        const inferredCategory = guessCategory(item.name);

        const merged = existing
          ? {
              id: existing.id,
              code: existing.code,
              name: existing.name,
              subtitle: existing.subtitle || "",
              category: existing.category || "General",
              price: Number(existing.price) || 0,
              status: existing.status || (existing.available ? "AVAILABLE" : "INACTIVE"),
              available: existing.available !== false,
              description: existing.description || "",
              image: existing.image || "",
              file: existing.file || ""
            }
          : {
              id: item.id,
              code: item.code,
              name: item.name,
              subtitle: "",
              category: inferredCategory,
              price: 10000,
              status: "AVAILABLE",
              available: true,
              description: "",
              image: buildPresetImage(item.code, item.name, inferredCategory),
              file: ""
            };

        Object.assign(merged, item.fields);

        if (!merged.image) {
          merged.image = buildPresetImage(
            merged.code || item.code,
            merged.name || item.name,
            merged.category || inferredCategory
          );
        }

        const matchedFile = assigned.get(item.id);
        if (matchedFile) merged.file = matchedFile.dataUri;
        else if (item.fileData) merged.file = item.fileData;

        if (!existing && item.fields.available === false && !item.fields.status) {
          merged.status = "INACTIVE";
        }

        const saved = await ProductModel.create(merged);

        if (existing) updated += 1;
        else created += 1;
        if (presetFiles.length > 0 && !merged.file) withoutFile.push(item.code);

        results.push({
          index: item.index,
          line: item.line,
          code: item.code,
          name: merged.name,
          action: existing ? "updated" : "created",
          fileAttached: !!matchedFile || !!item.fileData,
          product: saved
        });
      } catch (err) {
        errors.push({
          index: item.index,
          line: item.line,
          code: item.code,
          name: item.name,
          error: err.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: rawItems.length,
        succeeded: results.length,
        failed: errors.length,
        created,
        updated,
        filesUploaded: presetFiles.length,
        filesMatched: used.size,
        filesUnmatched: unmatchedFiles.length,
        withoutFile: withoutFile.length
      },
      results,
      errors,
      unmatchedFiles,
      withoutFile
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/products/bulk",
    methods: ["POST"],
    requiredFields: ["code", "name"],
    optionalFields: ["subtitle", "category", "price", "available", "status", "description", "image"],
    modes: {
      auto: "Upload file preset saja. Produk dibuat otomatis dari nama file, contoh 'LP01 Creamy.xmp' menjadi kode LP01 dan nama Creamy.",
      csv: "Upload CSV berisi minimal kolom code dan name. File preset dicocokkan berdasarkan awalan kode.",
      zipBundle:
        "Upload satu file ZIP berisi CSV dan/atau banyak file preset. ZIP akan diekstrak otomatis."
    },
    csvHeaders: CSV_TEMPLATE_HEADERS,
    csvExample:
      "code,name,subtitle,category,price,available,status,description,image\nLP01,Golden Tokyo Street,Warm sunset tones,Aesthetic,29000,true,AVAILABLE,Outdoor golden hour,https://example.com/lp01.jpg"
  });
}
