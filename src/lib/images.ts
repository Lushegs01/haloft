/**
 * Server-side image validation and metadata stripping.
 *
 * ── Why the client checks were not enough ───────────────────
 *
 * The upload path checked `file.type` in the browser and let the Supabase
 * bucket's allowed_mime_types check it again. Both read the SAME value:
 * a string the uploader supplies. A file's Content-Type is a claim, not a
 * property of its bytes. Rename anything to `.jpg`, hand it to the picker,
 * and it announces itself as image/jpeg to every layer that asks politely.
 *
 * What the bytes cannot lie about is their signature. Every format we
 * accept starts with a fixed sequence, so the first check here is: does
 * this file actually begin like the thing it says it is, and does the
 * container parse to the end of a real header?
 *
 * ── Why the metadata comes off ──────────────────────────────
 *
 * A photo taken on a phone carries EXIF, and EXIF carries GPS. A listing
 * photo of student accommodation, shot on the visit, published to the
 * open internet with the exact coordinates of the building and the
 * device that took it, is a privacy problem that no one notices until it
 * is one. It also carries orientation, colour profiles and sometimes
 * whole thumbnails — bytes served to every student on every page load.
 *
 * Stripping happens here rather than in an image library because it does
 * not need one: all three formats are chunked containers, and dropping
 * the metadata chunks is a walk over the structure. That keeps this file
 * dependency-free, which matters for something on the upload path.
 *
 * ── What this deliberately does NOT do ──────────────────────
 *
 * It does not re-encode, resize, or generate derivatives. Those need a
 * real codec (sharp), and adding a native dependency is a deployment
 * decision rather than a code one. Today Next's image pipeline generates
 * the responsive variants at request time and caches them for thirty days
 * (see next.config.ts), so the heavy originals are fetched once. If the
 * catalogue grows past what that comfortably covers, `deriveVariants` in
 * a sharp-backed worker is the next step — and it belongs behind this
 * validation, not instead of it.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type AllowedImageType = keyof typeof ALLOWED_IMAGE_TYPES;

export interface ImageInspection {
  ok: true;
  /** The type the BYTES say it is, which may differ from the claim. */
  mimeType: AllowedImageType;
  extension: string;
  width: number | null;
  height: number | null;
  /** The file with metadata chunks removed. */
  bytes: Uint8Array;
  bytesRemoved: number;
}

export interface ImageRejection {
  ok: false;
  reason: string;
}

export type ImageResult = ImageInspection | ImageRejection;

// ── Signatures ──────────────────────────────────────────────

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false;
  return signature.every((byte, i) => bytes[offset + i] === byte);
}

function detectFormat(bytes: Uint8Array): AllowedImageType | null {
  // JPEG: SOI marker
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, PNG_SIGNATURE)) return "image/png";
  // WebP: 'RIFF' <4-byte size> 'WEBP'
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "image/webp";
  }
  return null;
}

// ── JPEG ────────────────────────────────────────────────────

/**
 * Walks the JPEG segment list, dropping every APPn (metadata: EXIF, XMP,
 * ICC, Photoshop blocks) and COM segment, and reads the dimensions from
 * the first Start-Of-Frame it meets.
 *
 * A file whose segments do not walk cleanly to an SOF is not a JPEG,
 * whatever its first three bytes say — which is the second half of the
 * validation, and the half a signature check alone misses.
 */
function processJpeg(
  bytes: Uint8Array
): { width: number | null; height: number | null; bytes: Uint8Array } | null {
  const kept: Array<{ start: number; end: number }> = [];
  let width: number | null = null;
  let height: number | null = null;

  // SOI
  kept.push({ start: 0, end: 2 });
  let offset = 2;
  let sawFrame = false;

  while (offset < bytes.length - 1) {
    if (bytes[offset] !== 0xff) return null;

    let marker = bytes[offset + 1];
    // Fill bytes: 0xFF may repeat before the marker byte.
    let markerOffset = offset + 1;
    while (marker === 0xff && markerOffset < bytes.length - 1) {
      markerOffset += 1;
      marker = bytes[markerOffset];
    }

    // Start of scan: the entropy-coded image data runs to the end.
    if (marker === 0xda) {
      kept.push({ start: offset, end: bytes.length });
      break;
    }

    // Standalone markers carry no length.
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      kept.push({ start: offset, end: markerOffset + 1 });
      offset = markerOffset + 1;
      continue;
    }

    if (markerOffset + 3 > bytes.length) return null;
    const length = (bytes[markerOffset + 1] << 8) | bytes[markerOffset + 2];
    if (length < 2) return null;

    const segmentStart = offset;
    const segmentEnd = markerOffset + 1 + length;
    if (segmentEnd > bytes.length) return null;

    // SOF0..SOF15, excluding the DHT/JPG/DAC markers that share the range
    const isFrameHeader =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;

    if (isFrameHeader && !sawFrame) {
      // [marker][len:2][precision:1][height:2][width:2]
      const base = markerOffset + 3;
      if (base + 5 > bytes.length) return null;
      height = (bytes[base + 1] << 8) | bytes[base + 2];
      width = (bytes[base + 3] << 8) | bytes[base + 4];
      sawFrame = true;
    }

    const isMetadata = (marker >= 0xe0 && marker <= 0xef) || marker === 0xfe;
    if (!isMetadata) {
      kept.push({ start: segmentStart, end: segmentEnd });
    }

    offset = segmentEnd;
  }

  if (!sawFrame) return null;

  const total = kept.reduce((sum, r) => sum + (r.end - r.start), 0);
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const range of kept) {
    out.set(bytes.subarray(range.start, range.end), cursor);
    cursor += range.end - range.start;
  }

  return { width, height, bytes: out };
}

// ── PNG ─────────────────────────────────────────────────────

/** Ancillary chunks that carry text, EXIF or timestamps. */
const PNG_METADATA_CHUNKS = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "tIME"]);

function processPng(
  bytes: Uint8Array
): { width: number | null; height: number | null; bytes: Uint8Array } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const kept: Array<{ start: number; end: number }> = [{ start: 0, end: 8 }];

  let offset = 8;
  let width: number | null = null;
  let height: number | null = null;
  let sawHeader = false;
  let sawEnd = false;

  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7]
    );
    const chunkEnd = offset + 12 + length; // length + type + data + crc
    if (chunkEnd > bytes.length) return null;

    if (type === "IHDR") {
      if (length < 8) return null;
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
      sawHeader = true;
    }

    if (!PNG_METADATA_CHUNKS.has(type)) {
      kept.push({ start: offset, end: chunkEnd });
    }

    if (type === "IEND") {
      sawEnd = true;
      offset = chunkEnd;
      break;
    }

    offset = chunkEnd;
  }

  if (!sawHeader || !sawEnd || !width || !height) return null;

  const total = kept.reduce((sum, r) => sum + (r.end - r.start), 0);
  const out = new Uint8Array(total);
  let cursor = 0;
  for (const range of kept) {
    out.set(bytes.subarray(range.start, range.end), cursor);
    cursor += range.end - range.start;
  }

  return { width, height, bytes: out };
}

// ── WebP ────────────────────────────────────────────────────

const WEBP_METADATA_CHUNKS = new Set(["EXIF", "XMP "]);

function processWebp(
  bytes: Uint8Array
): { width: number | null; height: number | null; bytes: Uint8Array } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const riffSize = view.getUint32(4, true);
  if (riffSize + 8 > bytes.length + 1) return null;

  const kept: Array<{ start: number; end: number }> = [];
  let width: number | null = null;
  let height: number | null = null;
  let offset = 12;
  let sawImage = false;

  while (offset + 8 <= bytes.length) {
    const type = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );
    const size = view.getUint32(offset + 4, true);
    // RIFF chunks are padded to an even length.
    const chunkEnd = offset + 8 + size + (size % 2);
    if (chunkEnd > bytes.length + 1) return null;

    if (type === "VP8X" && size >= 10) {
      // Extended format. The canvas size here is authoritative and can
      // differ from the bitstream's own — an animation or an alpha layer
      // is composited onto it — so once VP8X has spoken, the VP8/VP8L
      // branches below must not overwrite it.
      // 24-bit little-endian, stored as (value - 1).
      width = 1 + (bytes[offset + 12] | (bytes[offset + 13] << 8) | (bytes[offset + 14] << 16));
      height = 1 + (bytes[offset + 15] | (bytes[offset + 16] << 8) | (bytes[offset + 17] << 16));
      sawImage = true;
    } else if (type === "VP8 " && size >= 10 && width === null) {
      // Lossy: 3-byte frame tag, 3-byte sync, then 14-bit dimensions
      const base = offset + 8 + 6;
      if (base + 4 <= bytes.length) {
        width = ((bytes[base + 1] << 8) | bytes[base]) & 0x3fff;
        height = ((bytes[base + 3] << 8) | bytes[base + 2]) & 0x3fff;
      }
      sawImage = true;
    } else if (type === "VP8 " || type === "VP8L") {
      // Bitstream present, dimensions already taken from VP8X.
      sawImage = true;
    } else if (type === "VP8L" && size >= 5 && width === null) {
      const base = offset + 8 + 1;
      if (base + 4 <= bytes.length) {
        const bits =
          bytes[base] | (bytes[base + 1] << 8) | (bytes[base + 2] << 16) | (bytes[base + 3] << 24);
        width = (bits & 0x3fff) + 1;
        height = ((bits >> 14) & 0x3fff) + 1;
      }
      sawImage = true;
    }

    if (!WEBP_METADATA_CHUNKS.has(type)) {
      kept.push({ start: offset, end: Math.min(chunkEnd, bytes.length) });
    }

    offset = chunkEnd;
  }

  if (!sawImage) return null;

  const payload = kept.reduce((sum, r) => sum + (r.end - r.start), 0);
  const out = new Uint8Array(12 + payload);
  out.set(bytes.subarray(0, 12), 0);
  let cursor = 12;
  for (const range of kept) {
    out.set(bytes.subarray(range.start, range.end), cursor);
    cursor += range.end - range.start;
  }
  // The RIFF size field counts everything after it, and chunks were removed.
  new DataView(out.buffer).setUint32(4, out.length - 8, true);

  return { width, height, bytes: out };
}

// ── The entry point ─────────────────────────────────────────

/** Dimensions past this are a decompression bomb, not a listing photo. */
const MAX_DIMENSION = 12000;
const MIN_DIMENSION = 200;

/**
 * Validates a candidate upload and returns the bytes to store.
 *
 * `claimedType` is accepted only as a cross-check: a mismatch between
 * what the browser said and what the bytes are is itself worth refusing,
 * because a legitimate picker never produces one.
 */
export function inspectImage(
  input: ArrayBuffer | Uint8Array,
  claimedType?: string
): ImageResult {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);

  if (bytes.length === 0) {
    return { ok: false, reason: "The file is empty." };
  }
  if (bytes.length > MAX_IMAGE_BYTES) {
    return { ok: false, reason: "Images must be 5 MB or smaller." };
  }

  const format = detectFormat(bytes);
  if (!format) {
    return {
      ok: false,
      reason: "That file is not a JPEG, PNG or WebP image.",
    };
  }

  if (claimedType && claimedType !== format) {
    return {
      ok: false,
      reason: `That file says it is ${claimedType} but its contents are ${format}.`,
    };
  }

  const processed =
    format === "image/jpeg"
      ? processJpeg(bytes)
      : format === "image/png"
        ? processPng(bytes)
        : processWebp(bytes);

  if (!processed) {
    return {
      ok: false,
      reason: "That image is damaged or incomplete and could not be read.",
    };
  }

  const { width, height } = processed;

  if (width && height) {
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      return { ok: false, reason: "That image is too large to publish." };
    }
    if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
      return {
        ok: false,
        reason: `Listing photos need to be at least ${MIN_DIMENSION}px on each side.`,
      };
    }
  }

  return {
    ok: true,
    mimeType: format,
    extension: ALLOWED_IMAGE_TYPES[format],
    width,
    height,
    bytes: processed.bytes,
    bytesRemoved: bytes.length - processed.bytes.length,
  };
}
