/**
 * Renders scripts/favicon/mark.svg into the app's icon set.
 *
 *   src/app/favicon.ico     16, 32, 48, 64, 128, 256 — tabs, bookmarks,
 *                           and the small icon most link-preview cards
 *                           (Slack, Discord, iMessage, search results)
 *                           put next to the title
 *   src/app/icon.png        512 — what Next emits as <link rel="icon">
 *   src/app/apple-icon.png  180 — iOS home screen
 *
 * Usage:
 *
 *   npm i --no-save playwright-core
 *   node scripts/build-favicon.mjs
 *
 * playwright-core is deliberately NOT in devDependencies, for the same
 * reason as scripts/build-og-image.mjs: this runs by hand when the mark
 * changes, and declaring it would make every CI run and every deploy pay
 * to install a browser they never use. Install it for the run, commit the
 * files, move on.
 *
 * ── Why this script exists ──────────────────────────────────
 *
 * `src/app/favicon.ico` shipped as the Next.js default — a black circle
 * with a white triangle. `icon.png` was the real mark, but browsers
 * prefer the .ico (Next emits it with `sizes="any"`, which wins in
 * Chrome), so every tab and every link preview showed Next's logo instead
 * of Haloft's.
 *
 * Rendering all three from one SVG, which itself copies its geometry from
 * the HaloftMark component, means there is one source for the mark and no
 * way for the tab to disagree with the header.
 */
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "scripts", "favicon", "mark.svg");
const appDir = path.join(root, "src", "app");

const svg = fs.readFileSync(source, "utf8");

/** Sizes packed into favicon.ico, smallest first. */
const ICO_SIZES = [16, 32, 48, 64, 128, 256];
/** The canvas colour behind the mark on iOS, which does not do alpha. */
const APPLE_BACKGROUND = "#f7f7f2";

const executablePath =
  process.env.CHROMIUM_PATH ??
  (process.env.PLAYWRIGHT_BROWSERS_PATH
    ? path.join(process.env.PLAYWRIGHT_BROWSERS_PATH, "chromium-1194", "chrome-linux", "chrome")
    : undefined);

const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

/**
 * One PNG at one size. `background` null means transparent — which is
 * what a favicon wants, so it sits on light and dark browser chrome
 * alike.
 */
async function render(size, background = null) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<style>
       html, body { margin: 0; padding: 0; background: ${background ?? "transparent"}; }
       svg { display: block; width: ${size}px; height: ${size}px; }
     </style>${svg}`
  );
  const buffer = await page.screenshot({ omitBackground: background === null });
  await page.close();
  return buffer;
}

/**
 * Packs PNG frames into an .ico.
 *
 * The format is a 6-byte header, then one 16-byte directory entry per
 * image, then the image payloads. Storing PNG rather than BMP inside the
 * container is legal and universally supported now; it also means the
 * 256px frame does not need a 256 KB uncompressed bitmap.
 *
 * Width and height are single bytes, so 256 is written as 0 — the one
 * genuinely surprising thing about the format.
 */
function packIco(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(frames.length, 4);

  const directory = Buffer.alloc(16 * frames.length);
  let offset = header.length + directory.length;

  frames.forEach((frame, i) => {
    const at = i * 16;
    directory.writeUInt8(frame.size >= 256 ? 0 : frame.size, at + 0);
    directory.writeUInt8(frame.size >= 256 ? 0 : frame.size, at + 1);
    directory.writeUInt8(0, at + 2); // palette size, 0 for truecolour
    directory.writeUInt8(0, at + 3); // reserved
    directory.writeUInt16LE(1, at + 4); // colour planes
    directory.writeUInt16LE(32, at + 6); // bits per pixel
    directory.writeUInt32LE(frame.data.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += frame.data.length;
  });

  return Buffer.concat([header, directory, ...frames.map((f) => f.data)]);
}

const frames = [];
for (const size of ICO_SIZES) {
  frames.push({ size, data: await render(size) });
}

const ico = packIco(frames);
fs.writeFileSync(path.join(appDir, "favicon.ico"), ico);
console.log(
  `Wrote src/app/favicon.ico — ${(ico.length / 1024).toFixed(1)} KB, ` +
    `${ICO_SIZES.join("/")}px`
);

const icon = await render(512);
fs.writeFileSync(path.join(appDir, "icon.png"), icon);
console.log(`Wrote src/app/icon.png — ${(icon.length / 1024).toFixed(1)} KB, 512px`);

const appleIcon = await render(180, APPLE_BACKGROUND);
fs.writeFileSync(path.join(appDir, "apple-icon.png"), appleIcon);
console.log(
  `Wrote src/app/apple-icon.png — ${(appleIcon.length / 1024).toFixed(1)} KB, 180px on ${APPLE_BACKGROUND}`
);

await browser.close();
