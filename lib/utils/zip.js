import zlib from "node:zlib";

/**
 * Pure Node.js zero-dependency in-memory ZIP builder.
 * Generates standard PKZIP compliant archives.
 *
 * @param {Array<{ filename: string, content: Buffer | string }>} files
 * @returns {Buffer}
 */
export function createZip(files) {
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  for (const file of files) {
    const filenameBuf = Buffer.from(file.filename, "utf-8");
    const contentBuf = Buffer.isBuffer(file.content) ? file.content : Buffer.from(file.content);
    const crc = zlib.crc32(contentBuf);
    const size = contentBuf.length;

    // Local file header: 30 bytes + name
    const lfh = Buffer.alloc(30 + filenameBuf.length);
    lfh.writeUInt32LE(0x04034b50, 0); // Local header signature
    lfh.writeUInt16LE(20, 4);         // Version needed (2.0)
    lfh.writeUInt16LE(0, 6);          // General flags
    lfh.writeUInt16LE(0, 8);          // Compression method: 0 (STORE)
    lfh.writeUInt16LE(0, 10);         // Last mod file time
    lfh.writeUInt16LE(0, 12);         // Last mod file date
    lfh.writeUInt32LE(crc, 14);       // CRC32
    lfh.writeUInt32LE(size, 18);      // Compressed size
    lfh.writeUInt32LE(size, 22);      // Uncompressed size
    lfh.writeUInt16LE(filenameBuf.length, 26); // Filename length
    lfh.writeUInt16LE(0, 28);         // Extra field length
    filenameBuf.copy(lfh, 30);

    localHeaders.push(lfh, contentBuf);

    // Central directory header: 46 bytes + name
    const cdh = Buffer.alloc(46 + filenameBuf.length);
    cdh.writeUInt32LE(0x02014b50, 0); // Central directory signature
    cdh.writeUInt16LE(20, 4);         // Version made by
    cdh.writeUInt16LE(20, 6);         // Version needed
    cdh.writeUInt16LE(0, 8);          // General flags
    cdh.writeUInt16LE(0, 10);         // Compression method: 0 (STORE)
    cdh.writeUInt16LE(0, 12);         // Time
    cdh.writeUInt16LE(0, 14);         // Date
    cdh.writeUInt32LE(crc, 16);       // CRC32
    cdh.writeUInt32LE(size, 20);      // Compressed size
    cdh.writeUInt32LE(size, 24);      // Uncompressed size
    cdh.writeUInt16LE(filenameBuf.length, 28); // Filename length
    cdh.writeUInt16LE(0, 30);         // Extra field length
    cdh.writeUInt16LE(0, 32);         // Comment length
    cdh.writeUInt16LE(0, 34);         // Disk number start
    cdh.writeUInt16LE(0, 36);         // Internal file attributes
    cdh.writeUInt32LE(0, 38);         // External file attributes
    cdh.writeUInt32LE(offset, 42);    // Relative offset of local header
    filenameBuf.copy(cdh, 46);

    centralHeaders.push(cdh);
    offset += lfh.length + contentBuf.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const c of centralHeaders) centralDirSize += c.length;

  // End of central directory record: 22 bytes
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // End of central dir signature
  eocd.writeUInt16LE(0, 4);          // Disk number
  eocd.writeUInt16LE(0, 6);          // Disk with start of central directory
  eocd.writeUInt16LE(files.length, 8);  // Number of entries on this disk
  eocd.writeUInt16LE(files.length, 10); // Total number of entries
  eocd.writeUInt32LE(centralDirSize, 12); // Central directory size
  eocd.writeUInt32LE(centralDirOffset, 16); // Central directory offset
  eocd.writeUInt16LE(0, 20);         // Comment length

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

/**
 * Mengekstrak file dari buffer ZIP tunggal (misal file .xmp di dalam zip produk).
 *
 * @param {Buffer} zipBuf
 * @returns {{ filename: string, content: Buffer } | null}
 */
export function extractFirstFileFromZip(zipBuf) {
  if (!zipBuf || zipBuf.length < 30) return null;
  if (zipBuf.readUInt32LE(0) !== 0x04034b50) return null;

  try {
    const compression = zipBuf.readUInt16LE(8);
    const compressedSize = zipBuf.readUInt32LE(18);
    const fnLen = zipBuf.readUInt16LE(26);
    const extraLen = zipBuf.readUInt16LE(28);

    const filename = zipBuf.subarray(30, 30 + fnLen).toString("utf-8");
    const dataOffset = 30 + fnLen + extraLen;
    const rawData = zipBuf.subarray(dataOffset, dataOffset + compressedSize);

    let content = rawData;
    if (compression === 8) {
      content = zlib.inflateRawSync(rawData);
    }

    return { filename, content };
  } catch (err) {
    console.warn("Gagal ekstrak file dari zip:", err.message);
    return null;
  }
}

/**
 * Mengekstrak seluruh file dari buffer ZIP (central directory based).
 * Mendukung metode STORE (0) dan DEFLATE (8).
 *
 * @param {Buffer} zipBuf
 * @param {{ maxTotalBytes?: number, maxEntries?: number }} options
 * @returns {Array<{ filename: string, content: Buffer }>}
 */
export function extractZipEntries(zipBuf, options = {}) {
  const maxTotalBytes = options.maxTotalBytes || 200 * 1024 * 1024;
  const maxEntries = options.maxEntries || 2000;

  if (!zipBuf || zipBuf.length < 22) return [];

  let eocdOffset = -1;
  const minOffset = Math.max(0, zipBuf.length - 22 - 0xffff);
  for (let i = zipBuf.length - 22; i >= minOffset; i -= 1) {
    if (zipBuf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) return [];

  const entryCount = zipBuf.readUInt16LE(eocdOffset + 10);
  const centralOffset = zipBuf.readUInt32LE(eocdOffset + 16);
  if (entryCount === 0 || centralOffset >= zipBuf.length) return [];

  const entries = [];
  let pointer = centralOffset;
  let totalBytes = 0;

  for (let index = 0; index < entryCount && entries.length < maxEntries; index += 1) {
    if (pointer + 46 > zipBuf.length) break;
    if (zipBuf.readUInt32LE(pointer) !== 0x02014b50) break;

    const flags = zipBuf.readUInt16LE(pointer + 8);
    const method = zipBuf.readUInt16LE(pointer + 10);
    const compressedSize = zipBuf.readUInt32LE(pointer + 20);
    const nameLength = zipBuf.readUInt16LE(pointer + 28);
    const extraLength = zipBuf.readUInt16LE(pointer + 30);
    const commentLength = zipBuf.readUInt16LE(pointer + 32);
    const localOffset = zipBuf.readUInt32LE(pointer + 42);
    const filename = zipBuf
      .subarray(pointer + 46, pointer + 46 + nameLength)
      .toString(flags & 0x800 ? "utf-8" : "utf8");

    pointer += 46 + nameLength + extraLength + commentLength;

    if (filename.endsWith("/")) continue;
    if (localOffset + 30 > zipBuf.length) continue;
    if (zipBuf.readUInt32LE(localOffset) !== 0x04034b50) continue;

    const localNameLength = zipBuf.readUInt16LE(localOffset + 26);
    const localExtraLength = zipBuf.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = zipBuf.subarray(dataOffset, dataOffset + compressedSize);

    let content;
    try {
      if (method === 0) content = Buffer.from(compressed);
      else if (method === 8) content = zlib.inflateRawSync(compressed);
      else continue;
    } catch {
      continue;
    }

    totalBytes += content.length;
    if (totalBytes > maxTotalBytes) break;

    entries.push({ filename, content });
  }

  return entries;
}

/**
 * Membangun 1 file master ZIP bundling dari daftar preset database.
 *
 * @param {Array<{ code: string, name: string, buffer: Buffer }>} presets
 * @param {string} bundleName
 * @returns {Buffer}
 */
export function createBundleZip(presets, bundleName = "LUMA_Custom_Bundle") {
  const zipEntries = [];

  const guideText = `========================================================
✨ LUMA PRESETS — PANDUAN PENGGUNAAN BUNDLE
========================================================
Paket: ${bundleName}
Jumlah Preset: ${presets.length} Preset

CARA INSTAL DI LIGHTROOM MOBILE (iOS & Android):
1. Ekstrak file .zip ini di File Manager HP Anda.
2. Buka Adobe Lightroom Mobile.
3. Buka foto apa saja yang ingin Anda edit.
4. Geser menu bawah ke kanan, pilih "Presets" (Preset).
5. Tap ikon titik tiga (...) di pojok kanan atas -> pilih "Import Presets" (Impor Preset).
6. Pilih file-file .xmp yang sudah diekstrak.
7. Preset langsung tersimpan di library dan siap digunakan kapan saja!

TIPS HASIL MAKSIMAL:
Setelah preset diaplikasikan, cukup sesuaikan "Exposure" (Pencahayaan)
dan "Temperature" (Suhu Warna) sesuai kondisi pencahayaan foto asli Anda.

Terima kasih telah mempercayai LUMA PRESETS!
Web: https://lumapresets.com
Bantuan: Hubungi WhatsApp Admin kami
========================================================
`;

  zipEntries.push({
    filename: "PANDUAN_INSTALASI_LUMA.txt",
    content: Buffer.from(guideText, "utf-8")
  });

  for (const p of presets) {
    if (!p.buffer) continue;
    const extracted = extractFirstFileFromZip(p.buffer);
    if (extracted) {
      zipEntries.push({
        filename: extracted.filename || `${p.code}_${p.name}.xmp`,
        content: extracted.content
      });
    } else {
      zipEntries.push({
        filename: `${p.code}_${p.name.replace(/[^a-zA-Z0-9]/g, "_")}.zip`,
        content: p.buffer
      });
    }
  }

  return createZip(zipEntries);
}
