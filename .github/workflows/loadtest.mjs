/**
 * Load test driver for .github/workflows/loadtest.yml.
 *
 * Reads BASE, PROFILE, CONNS and SECS from the environment, runs autocannon
 * against the routes that profile selects, and writes a verdict to the job
 * summary.
 *
 * Two things it does that a bare `npx autocannon` does not:
 *
 *   1. Sends Accept-Encoding. autocannon omits it, so it pulls uncompressed
 *      HTML — 161 KB where a browser takes 16 KB. Ten times the bytes for
 *      traffic no real visitor generates, which turns any test on a normal
 *      connection into a bandwidth measurement.
 *
 *   2. Reports p97.5/p99 and the non-2xx count rather than requests/second.
 *      Throughput against a CDN tells you about the wire between you and it.
 *      Latency at the tail and the error rate are what students feel.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const BASE = process.env.BASE?.replace(/\/$/, "") ?? "";
const PROFILE = process.env.PROFILE ?? "dynamic";
const CONNS = process.env.CONNS ?? "100";
const SECS = process.env.SECS ?? "30";

if (!BASE.startsWith("https://")) {
  console.error(`Refusing to run: BASE must be an https URL, got "${BASE}"`);
  process.exit(1);
}

// The cached routes exist to prove a negative — that load here does NOT
// reach Postgres. The dynamic ones are the actual risk surface: /search is
// force-dynamic and queries per request (its data is cached per filter set,
// so a single query only ever exercises one warm entry — hence two of them).
const ROUTES = {
  cached: [
    { label: "landing (ISR)", path: "/" },
    { label: "campus (ISR)", path: "/funaab" },
  ],
  dynamic: [
    // One filter every request: the route still renders per request, but its
    // data comes from a single warm cache entry. This is the common case —
    // most students search the same few things.
    { label: "search, warm filter", path: "/funaab/search?q=self+contained" },
    // A filter nothing has asked for, so the run opens on a genuine cache
    // miss and a real Postgres read before settling warm. Timestamped so it
    // is cold on every run rather than warm from the last one.
    { label: "search, cold filter", path: `/funaab/search?q=cold${Date.now()}` },
  ],
};
const plan = PROFILE === "mixed" ? [...ROUTES.cached, ...ROUTES.dynamic] : ROUTES[PROFILE];

const run = ({ label, path }) => {
  const args = [
    "--yes",
    "autocannon",
    "-c", CONNS,
    "-d", SECS,
    // autocannon sends no Accept-Encoding of its own, so without this it
    // pulls uncompressed HTML — ten times the bytes a browser takes.
    "-H", "Accept-Encoding: gzip, br",
    // Identify the traffic, so it reads as a known test in Vercel's logs
    // rather than as an attack from an unknown client.
    "-H", "User-Agent: haloft-loadtest (github actions)",
    "--renderStatusCodes",
    "--json",
    `${BASE}${path}`,
  ];

  console.log(`\n=== ${label} — ${CONNS} connections, ${SECS}s ===`);
  const out = execFileSync("npx", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const r = JSON.parse(out);

  // Use the explicit counters rather than inferring from requests.total,
  // which counts completed responses and so silently excludes timeouts.
  const ok = r["2xx"] ?? 0;
  const nonOk = r.non2xx ?? 0;
  const answered = ok + nonOk;

  // Nothing came back at all. That is a broken run — an unreachable host, a
  // proxy in the way, DNS — and reporting it as "0% success" would read as a
  // catastrophic result for the site instead of a test that never happened.
  if (answered === 0) {
    throw new Error(
      `${label}: no responses (sent ${r.requests?.sent ?? 0}, ` +
        `errors ${r.errors ?? 0}, timeouts ${r.timeouts ?? 0}). ` +
        `The target was not reachable from this runner — check the URL, ` +
        `not the site's capacity.`
    );
  }

  return {
    label,
    p50: r.latency?.p50 ?? 0,
    p97: r.latency?.p97_5 ?? 0,
    p99: r.latency?.p99 ?? 0,
    max: r.latency?.max ?? 0,
    rps: Math.round(r.requests?.average ?? 0),
    answered,
    nonOk,
    timeouts: r.timeouts ?? 0,
    okRate: ((ok / answered) * 100).toFixed(1),
  };
};

const results = plan.map(run);

const rows = results
  .map(
    (r) =>
      `| ${r.label} | ${r.p50} ms | ${r.p97} ms | ${r.p99} ms | ${r.rps} | ${r.okRate}% | ${r.nonOk} | ${r.timeouts} |`
  )
  .join("\n");

const summary = `
## Load test — ${CONNS} connections for ${SECS}s

\`${BASE}\`, profile \`${PROFILE}\`

| Route | p50 | p97.5 | p99 | req/s | 2xx rate | non-2xx | timeouts |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows}

### Reading this

- **p99 is the number that matters.** It is the slowest 1 in 100 — during
  intake that is hundreds of students, not a rounding error. Under ~1s is
  healthy; over ~3s means something is queueing.
- **A non-2xx rate above a percent or two is the real signal.** It is
  usually Vercel shedding load or a Supabase connection ceiling, not slowness.
- **Ignore req/s unless it is pinned flat**, which means you hit a bandwidth
  wall somewhere and measured the wire instead of the origin.
- **Cross-check Supabase → Reports → API while this runs.** Cached routes
  should barely move the request count. If they climb with load, something on
  that path is reaching the cookie-bound client and the ISR caching is gone.
`;

fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY ?? "/dev/stdout", summary);
console.log(summary);

// Fail the run on a genuinely bad result so this is usable as a gate.
const worst = results.reduce((a, b) => (Number(a.okRate) < Number(b.okRate) ? a : b));
if (Number(worst.okRate) < 95) {
  console.error(`\nFAILED: ${worst.label} served only ${worst.okRate}% 2xx.`);
  process.exit(1);
}
