import { AccessCodeModel } from "@/lib/models/accessCode.model.js";
import { ProductModel } from "@/lib/models/product.model.js";
import { createBundleZip } from "@/lib/utils/zip.js";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = (searchParams.get("code") || "").trim().toUpperCase();
    const specificProductId = (searchParams.get("productId") || "").trim();

    if (!code) {
      return new Response("Kode akses diperlukan.", { status: 400 });
    }

    const ac = await AccessCodeModel.findByCode(code);
    if (!ac) {
      return new Response("Kode akses tidak valid.", { status: 403 });
    }

    // 1. Single product from bundle
    if (specificProductId) {
      let allowed = false;
      if (ac.product_id === specificProductId) allowed = true;
      if (ac.bundle_items) {
        try {
          const items = JSON.parse(ac.bundle_items);
          if (items.includes(specificProductId)) allowed = true;
        } catch {}
      }

      if (!allowed) {
        return new Response("Preset ini tidak termasuk dalam paket yang Anda beli.", { status: 403 });
      }

      const fileResult = await ProductModel.getFileBinary(specificProductId);
      if (!fileResult || !fileResult.buffer) {
        return new Response("File preset belum diunggah ke database.", { status: 404 });
      }

      await AccessCodeModel.incrementDownload(code);
      return new Response(fileResult.buffer, {
        headers: {
          "Content-Type": fileResult.mimeType || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${fileResult.fileName}"`,
          "Content-Length": fileResult.buffer.length.toString()
        }
      });
    }

    // 2. Master Bundle ZIP
    if (ac.bundle_items) {
      let itemIds = [];
      try {
        itemIds = JSON.parse(ac.bundle_items);
      } catch {}

      if (Array.isArray(itemIds) && itemIds.length > 0) {
        const presets = await ProductModel.getMultipleFilesBinary(itemIds);
        if (presets.length === 0) {
          return new Response("File-file preset dalam bundle belum tersedia di database.", { status: 404 });
        }

        const bundleProduct = await ProductModel.findById(ac.product_id);
        const bundleName = bundleProduct?.name || "LUMA Bundle";
        const bundleZipBuffer = createBundleZip(presets, bundleName);

        await AccessCodeModel.incrementDownload(code);
        const fileName = `LUMA_${(bundleProduct?.code || "BUNDLE").replace(/[^a-zA-Z0-9]/g, "_")}_${itemIds.length}_Presets.zip`;

        return new Response(bundleZipBuffer, {
          headers: {
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="${fileName}"`,
            "Content-Length": bundleZipBuffer.length.toString()
          }
        });
      }
    }

    // 3. Regular single preset
    const fileResult = await ProductModel.getFileBinary(ac.product_id);
    if (!fileResult || !fileResult.buffer) {
      return new Response("File preset belum diunggah ke database.", { status: 404 });
    }

    await AccessCodeModel.incrementDownload(code);
    return new Response(fileResult.buffer, {
      headers: {
        "Content-Type": fileResult.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileResult.fileName}"`,
        "Content-Length": fileResult.buffer.length.toString()
      }
    });
  } catch (err) {
    console.error("[Download Error]:", err);
    return new Response(err.message, { status: 500 });
  }
}
