/**
 * Renders scripts/og-image.html to public/og-image.png at 1200x630.
 *
 * The card is built as a real page rather than drawn in an image editor
 * so it uses the same fonts, palette and façade study as the site — edit
 * the HTML and re-run this to regenerate.
 *
 *   npm i --no-save playwright-core
 *   node scripts/build-og-image.mjs
 *
 * playwright-core is deliberately NOT in devDependencies: this runs by
 * hand every year or so, and declaring it would make every CI and deploy
 * install pay for it. Install it for the run, commit the PNG, move on.
 *
 * Needs a Chromium too. Uses CHROMIUM_PATH, else PLAYWRIGHT_BROWSERS_PATH,
 * else whatever playwright finds by default.
 */
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "scripts", "og-image.html");
const output = path.join(root, "public", "og-image.png");

const executablePath =
  process.env.CHROMIUM_PATH ??
  (process.env.PLAYWRIGHT_BROWSERS_PATH
    ? path.join(process.env.PLAYWRIGHT_BROWSERS_PATH, "chromium-1194", "chrome-linux", "chrome")
    : undefined);

const browser = await chromium.launch({
  ...(executablePath ? { executablePath } : {}),
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2, // 2x, so type and hairlines survive the crawlers' own resizing
});

await page.goto(`file://${source}`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);

// PNG, not JPEG: the card is flat vector colour and type, which JPEG
// bands and blurs at the edges. PNG is both crisper and smaller here.
await page.screenshot({
  path: output,
  type: "png",
  clip: { x: 0, y: 0, width: 1200, height: 630 },
});

await browser.close();

const { size } = fs.statSync(output);
console.log(`Wrote ${path.relative(root, output)} — ${(size / 1024).toFixed(1)} KB`);
