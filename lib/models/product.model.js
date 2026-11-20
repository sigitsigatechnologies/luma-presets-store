import { db } from "../config/database.js";
import { seedProducts } from "../seed-data.js";

export function formatProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    subtitle: row.subtitle || "",
    category: row.category || "General",
    price: Number(row.price) || 0,
    status: row.status || (row.available ? "AVAILABLE" : "INACTIVE"),
    available: row.available !== false && row.available !== 0 && row.available !== "false",
    description: row.description || "",
    image: row.image || "",
    hasFile: !!row.file
  };
}

function isValidBase64(value) {
  if (!value || value.length % 4 === 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
    return false;
  }

  try {
    const decoded = Buffer.from(value, "base64");
    return decoded.length > 0;
  } catch {
    return false;
  }
}

export const ProductModel = {
  async findAll() {
    try {
      const { data, error } = await db.from("products").select("*").order("id");
      if (!error && data && data.length > 0) {
        return data.map(formatProduct);
      }
    } catch (err) {
      console.warn("[Supabase findAll warning]:", err.message);
    }
    // Fallback to initial catalogue if Supabase table is empty or RLS restricted
    return seedProducts.map(formatProduct);
  },

  async findById(id) {
    try {
      const { data } = await db.from("products").select("*").eq("id", id).maybeSingle();
      if (data) return formatProduct(data);
    } catch (_) {}
    const fallback = seedProducts.find((p) => p.id === id);
    return fallback ? formatProduct(fallback) : null;
  },

  async getRawById(id) {
    try {
      const { data } = await db.from("products").select("*").eq("id", id).maybeSingle();
      if (data) return data;
    } catch (_) {}
    const fallback = seedProducts.find((p) => p.id === id);
    return fallback || null;
  },

  async getFileBinary(id) {
    const raw = await this.getRawById(id);
    if (!raw || !raw.file) return null;

    let buffer = null;
    let mimeType = "application/zip";
    let extension = "zip";
    const baseName = `${raw.code}_${raw.name.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const fileValue = typeof raw.file === "string" ? raw.file.trim() : "";

    if (fileValue.startsWith("data:")) {
      const commaIndex = fileValue.indexOf(",");
      const metadata = commaIndex >= 0 ? fileValue.slice(5, commaIndex) : "";
      const base64Part = commaIndex >= 0 ? fileValue.slice(commaIndex + 1).replace(/\s/g, "") : "";
      mimeType = metadata.split(";")[0] || mimeType;
      if (mimeType === "application/rdf+xml" || mimeType === "text/xml" || mimeType === "application/xml") extension = "xmp";
      else if (mimeType === "image/x-adobe-dng") extension = "dng";
      if (base64Part && isValidBase64(base64Part)) buffer = Buffer.from(base64Part, "base64");
    } else if (fileValue.length > 200 && isValidBase64(fileValue)) {
      buffer = Buffer.from(fileValue.replace(/\s/g, ""), "base64");
    }

    return { buffer, mimeType, fileName: `${baseName}.${extension}`, product: formatProduct(raw) };
  },

  async getMultipleFilesBinary(ids) {
    const results = [];
    for (const id of ids) {
      const fb = await this.getFileBinary(id);
      if (fb && fb.buffer) {
        results.push({
          id,
          code: fb.product?.code || id.toUpperCase(),
          name: fb.product?.name || id,
          buffer: fb.buffer
        });
      }
    }
    return results;
  },

  async create(data) {
    const id = data.id || (data.code ? String(data.code).toLowerCase().replace(/[^a-z0-9]/g, "") : `p${Date.now()}`);
    
    let fileContent = data.file || "";
    if (data.fileData) {
      fileContent = `data:application/zip;base64,${data.fileData}`;
    }

    const row = {
      id,
      code: data.code || id.toUpperCase(),
      name: data.name || "Untitled",
      subtitle: data.subtitle || "",
      category: data.category || "General",
      price: Number(data.price) || 0,
      status: data.status || (data.available ? "AVAILABLE" : "INACTIVE"),
      available: data.available !== false && data.available !== 0,
      description: data.description || "",
      image: data.image || "",
      file: fileContent
    };

    const { data: created, error } = await db.from("products").upsert(row).select().maybeSingle();
    if (error) {
      console.error("[Supabase create error]:", error.message);
      throw new Error(error.message);
    }
    return formatProduct(created || row);
  },

  async update(id, data) {
    const existing = await this.getRawById(id);
    if (!existing) throw new Error("Produk tidak ditemukan");

    let fileContent = existing.file;
    if (data.fileData) {
      fileContent = `data:application/zip;base64,${data.fileData}`;
    } else if (data.file !== undefined && data.file !== "") {
      fileContent = data.file;
    }

    const updates = {
      id,
      code: data.code !== undefined ? data.code : existing.code,
      name: data.name !== undefined ? data.name : existing.name,
      subtitle: data.subtitle !== undefined ? data.subtitle : existing.subtitle,
      category: data.category !== undefined ? data.category : existing.category,
      price: data.price !== undefined ? Number(data.price) : existing.price,
      status: data.status !== undefined ? data.status : existing.status,
      available: data.available !== undefined ? (data.available ? true : false) : (existing.available ? true : false),
      description: data.description !== undefined ? data.description : existing.description,
      image: data.image !== undefined ? data.image : existing.image,
      file: fileContent
    };

    const { data: updated, error } = await db.from("products").upsert(updates).select().maybeSingle();
    if (error) {
      console.error("[Supabase update error]:", error.message);
      throw new Error(error.message);
    }
    return formatProduct(updated || updates);
  },

  async delete(id) {
    try {
      await db.from("access_codes").delete().eq("product_id", id);
    } catch (_) {}
    const { error } = await db.from("products").delete().eq("id", id);
    if (error) {
      console.error("[Supabase delete error]:", error.message);
      throw new Error(error.message);
    }
    return true;
  }
};
