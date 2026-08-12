import { describe, it, expect } from "vitest";
import { inspectImage } from "./images";

/**
 * Minimal, hand-built files. Real photos would make these tests depend on
 * fixtures nobody can read; building the containers by hand means every
 * byte the parser looks at is visible right here.
 */

function bytes(...parts: Array<number[] | Uint8Array>): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  for (const part of parts) {
    out.set(part instanceof Uint8Array ? part : new Uint8Array(part), at);
    at += part.length;
  }
  return out;
}

function u32be(value: number): number[] {
  return [(value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
}

function u32le(value: number): number[] {
  return [value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255];
}

function ascii(text: string): number[] {
  return [...text].map((c) => c.charCodeAt(0));
}

// ── PNG ─────────────────────────────────────────────────────

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** length + type + data + a CRC placeholder (never verified here). */
function pngChunk(type: string, data: number[]): number[] {
  return [...u32be(data.length), ...ascii(type), ...data, 0, 0, 0, 0];
}

function makePng(width = 800, height = 600, withText = true): Uint8Array {
  return bytes(
    PNG_SIG,
    pngChunk("IHDR", [...u32be(width), ...u32be(height), 8, 6, 0, 0, 0]),
    ...(withText ? [pngChunk("tEXt", ascii("Comment\0taken at 7.25N 3.45E"))] : []),
    pngChunk("IDAT", [1, 2, 3, 4, 5, 6, 7, 8]),
    pngChunk("IEND", [])
  );
}

// ── JPEG ────────────────────────────────────────────────────

function jpegSegment(marker: number, payload: number[]): number[] {
  const length = payload.length + 2;
  return [0xff, marker, (length >> 8) & 255, length & 255, ...payload];
}

function makeJpeg(width = 1024, height = 768, withExif = true): Uint8Array {
  const sof = [
    8, // precision
    (height >> 8) & 255,
    height & 255,
    (width >> 8) & 255,
    width & 255,
    3, // components
    1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1,
  ];

  return bytes(
    [0xff, 0xd8], // SOI
    ...(withExif
      ? [jpegSegment(0xe1, [...ascii("Exif\0\0"), ...ascii("GPS 7.25N 3.45E, iPhone 15")])]
      : []),
    jpegSegment(0xdb, new Array(65).fill(1)), // quantisation table
    jpegSegment(0xc0, sof), // SOF0
    jpegSegment(0xc4, new Array(20).fill(0)), // Huffman table
    [0xff, 0xda, 0x00, 0x08, 1, 1, 0, 0, 0x3f, 0], // SOS
    [0x12, 0x34, 0x56, 0x78], // "image data"
    [0xff, 0xd9] // EOI
  );
}

// ── WebP ────────────────────────────────────────────────────

function riffChunk(type: string, data: number[]): number[] {
  const padded = data.length % 2 === 1 ? [...data, 0] : data;
  return [...ascii(type), ...u32le(data.length), ...padded];
}

function makeWebp(width = 640, height = 480, withExif = true): Uint8Array {
  const vp8x = riffChunk("VP8X", [
    0x10, 0, 0, 0, // flags: has EXIF
    (width - 1) & 255, ((width - 1) >> 8) & 255, ((width - 1) >> 16) & 255,
    (height - 1) & 255, ((height - 1) >> 8) & 255, ((height - 1) >> 16) & 255,
  ]);
  const exif = withExif ? riffChunk("EXIF", ascii("GPS 7.25N 3.45E")) : [];
  const vp8 = riffChunk("VP8 ", new Array(16).fill(0x42));

  const payload = [...vp8x, ...exif, ...vp8];
  return bytes(ascii("RIFF"), u32le(payload.length + 4), ascii("WEBP"), payload);
}

// ────────────────────────────────────────────────────────────

describe("inspectImage — format detection", () => {
  it("reads a PNG and its dimensions", () => {
    const result = inspectImage(makePng(800, 600));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mimeType).toBe("image/png");
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it("reads a JPEG and its dimensions", () => {
    const result = inspectImage(makeJpeg(1024, 768));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mimeType).toBe("image/jpeg");
    expect(result.width).toBe(1024);
    expect(result.height).toBe(768);
  });

  it("reads a WebP and its dimensions", () => {
    const result = inspectImage(makeWebp(640, 480));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.mimeType).toBe("image/webp");
    expect(result.width).toBe(640);
    expect(result.height).toBe(480);
  });
});

describe("inspectImage — what the client claims", () => {
  it("rejects a non-image whatever its Content-Type says", () => {
    // The whole point: this is what an executable renamed .jpg looks
    // like to a check that only reads file.type.
    const notAnImage = bytes(ascii("MZ\x90\x00"), new Array(500).fill(0x41));
    const result = inspectImage(notAnImage, "image/jpeg");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toMatch(/not a JPEG, PNG or WebP/i);
  });

  it("rejects a real image whose declared type does not match its bytes", () => {
    const result = inspectImage(makePng(), "image/jpeg");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toMatch(/says it is image\/jpeg/);
  });

  it("accepts an image whose declared type is correct", () => {
    expect(inspectImage(makePng(), "image/png").ok).toBe(true);
  });

  it("rejects an empty file", () => {
    expect(inspectImage(new Uint8Array(0)).ok).toBe(false);
  });

  it("rejects a file that starts like a JPEG but does not parse", () => {
    // Correct signature, then nothing that walks to a frame header.
    const truncated = bytes([0xff, 0xd8, 0xff], new Array(200).fill(0));
    expect(inspectImage(truncated).ok).toBe(false);
  });
});

describe("inspectImage — metadata stripping", () => {
  it("removes the EXIF segment from a JPEG", () => {
    const withExif = makeJpeg(1024, 768, true);
    const result = inspectImage(withExif);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.bytesRemoved).toBeGreaterThan(0);
    expect(result.bytes.length).toBeLessThan(withExif.length);

    // The GPS string must not survive into what gets published.
    const text = Buffer.from(result.bytes).toString("latin1");
    expect(text).not.toContain("GPS 7.25N");
    expect(text).not.toContain("iPhone");
  });

  it("keeps the JPEG readable after stripping", () => {
    const first = inspectImage(makeJpeg(1024, 768, true));
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    // Re-inspecting the output must give the same picture back: the
    // structure survived, only the metadata went.
    const second = inspectImage(first.bytes);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.width).toBe(1024);
    expect(second.height).toBe(768);
    expect(second.bytesRemoved).toBe(0);
  });

  it("removes text chunks from a PNG", () => {
    const result = inspectImage(makePng(800, 600, true));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const text = Buffer.from(result.bytes).toString("latin1");
    expect(text).not.toContain("taken at");
    expect(text).toContain("IHDR");
    expect(text).toContain("IDAT");
    expect(text).toContain("IEND");
  });

  it("removes the EXIF chunk from a WebP and fixes the RIFF size", () => {
    const result = inspectImage(makeWebp(640, 480, true));
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const text = Buffer.from(result.bytes).toString("latin1");
    expect(text).not.toContain("GPS 7.25N");

    // A RIFF size field that no longer matches the payload makes the
    // file unreadable, so the rewrite has to be checked, not assumed.
    const view = new DataView(
      result.bytes.buffer,
      result.bytes.byteOffset,
      result.bytes.byteLength
    );
    expect(view.getUint32(4, true)).toBe(result.bytes.length - 8);
  });

  it("leaves a file with no metadata untouched", () => {
    const clean = makePng(800, 600, false);
    const result = inspectImage(clean);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bytesRemoved).toBe(0);
  });
});

describe("inspectImage — size limits", () => {
  it("rejects anything over 5 MB", () => {
    const huge = bytes(PNG_SIG, new Array(5 * 1024 * 1024).fill(0));
    const result = inspectImage(huge);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toMatch(/5 MB/);
  });

  it("rejects an image too small to be a listing photo", () => {
    const result = inspectImage(makePng(120, 90));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toMatch(/at least 200px/);
  });

  it("rejects absurd dimensions that would blow up a decoder", () => {
    const result = inspectImage(makePng(30000, 30000));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toMatch(/too large/);
  });
});
