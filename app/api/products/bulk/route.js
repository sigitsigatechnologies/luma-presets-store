import { NextResponse } from "next/server";
import { ProductModel } from "@/lib/models/product.model.js";
import { isAuthenticated } from "@/lib/auth.js";

export const dynamic = "force-dynamic";

// POST /api/products/bulk
// Body: { products: [...] } or { csv: "code,name,..." }
export async function POST(req) {
  try {
    if (!isAuthenticated(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";
    let body = {};
    let uploadedCsv = "";
    const presetFiles = new Map();

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      if (!file || typeof file.text !== "function") {
        return NextResponse.json({ error: "CSV file is required." }, { status: 400 });
      }
      uploadedCsv = await file.text();

      const files = formData.getAll("presetFiles");
      for (const presetFile of files) {
        if (!presetFile || typeof presetFile.arrayBuffer !== "function") continue;
        const originalName = String(presetFile.name || "");
        const code = originalName.replace(/\.[^.]+$/, "").split(/[-_ ]/)[0].toUpperCase();
        if (!code) continue;
        const bytes = Buffer.from(await presetFile.arrayBuffer());
        const extension = originalName.split(".").pop().toLowerCase();
        const mime = extension === "zip"
          ? "application/zip"
          : extension === "xmp"
            ? "application/rdf+xml"
            : extension === "dng"
              ? "image/x-adobe-dng"
              : (presetFile.type || "application/octet-stream");
        presetFiles.set(code, `data:${mime};base64,${bytes.toString("base64")}`);
      }
    } else {
      body = await req.json();
    }

    const { products, csv, format } = body;
    let items = [];

    if (uploadedCsv || format === "csv" || csv) {
      items = parseCSV(uploadedCsv || csv || "");
    } else if (Array.isArray(products)) {
      items = products;
    } else if (body.items && Array.isArray(body.items)) {
      items = body.items;
    } else {
      return NextResponse.json(
        { error: "Invalid request. Provide a CSV file or a products array." },
        { status: 400 }
      );
    }

    if (items.length === 0) {
      return NextResponse.json({ error: "No products to import" }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        // Validate required fields
        if (!item.code && !item.id) {
          throw new Error("Missing 'code' field");
        }
        if (!item.name) {
          throw new Error("Missing 'name' field");
        }

        const itemCode = String(item.code || item.id || "").toUpperCase();
        const created = await ProductModel.create({
          ...item,
          file: presetFiles.get(itemCode) || item.file || "",
          price: Number(item.price) || 0,
          available: item.available !== undefined ? Boolean(item.available) : true,
          status: item.status || (item.available !== false ? "AVAILABLE" : "INACTIVE"),
        });

        results.push({ index: i, success: true, product: created });
      } catch (err) {
        errors.push({ index: i, error: err.message, item });
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: items.length,
        succeeded: results.length,
        failed: errors.length,
      },
      results,
      errors,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function parseCSV(csv) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    if (char === '"' && csv[i + 1] === '"' && quoted) {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && csv[i + 1] === "\n") i += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value.trim());
    rows.push(row);
  }
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) =>
    header.replace(/^\uFEFF/, "").toLowerCase().trim()
  );

  return rows.slice(1).map((values) => {
    const item = {};
    headers.forEach((header, index) => {
      let val = values[index] || "";
      const normalized = String(val).toLowerCase();
      if (["true", "yes", "1"].includes(normalized)) val = true;
      else if (["false", "no", "0"].includes(normalized)) val = false;
      else if (header === "price" && val !== "" && !Number.isNaN(Number(val))) {
        val = Number(val);
      }
      item[header] = val;
    });
    return item;
  });
}

// GET - return bulk upload template/info
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/products/bulk",
    methods: ["POST"],
    formats: {
      json: {
        description: "Array of product objects",
        example: {
          products: [
            {
              code: "LP01",
              name: "Product Name",
              category: "Aesthetic",
              price: 29000,
              available: true,
            },
          ],
        },
      },
      csv: {
        description: "CSV string with headers",
        example: "code,name,category,price,available\nLP01,Product Name,Aesthetic,29000,true",
      },
    },
    requiredFields: ["code", "name"],
    optionalFields: [
      "subtitle",
      "category",
      "price",
      "available",
      "status",
      "description",
      "image",
      "file",
    ],
  });
}
