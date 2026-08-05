/**
 * Elevation — Haloft's drawn stand-in for photography.
 *
 * Listing photography on this site is real: it comes from the catalogue.
 * Where the catalogue has no photo yet we do not borrow a stock image of
 * a smiling student; we draw the building. These are cropped façade
 * studies in the brand's tones — fine enough in grain that they still
 * read as architecture whether they fill a hero or a thumbnail.
 *
 * Rendered as inline SVG (no request, no layout shift) and set to `slice`
 * so it crops like a photograph inside whatever frame it is given.
 *
 * The component fills its parent absolutely, so that parent must be
 * positioned (`relative`) and carry its own height or aspect ratio.
 */

type Variant = "tower" | "terrace" | "court";

const SKY = "#edefe9";
const WALL = "#e7e0d1";
const WALL_ALT = "#ded6c4";
const WALL_DEEP = "#cdc4b0";
const NAVY = "#1a2a44";
const TEAL = "#2a9d8f";
const SAND = "#e5a973";

/** A window with a mullion and transom, so it reads as joinery. */
function Window({
  x,
  y,
  w,
  h,
  lit = false,
  wall = WALL,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  lit?: boolean;
  wall?: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={1.5}
        fill={lit ? SAND : NAVY}
        opacity={lit ? 0.8 : 0.86}
      />
      <rect x={x + w / 2 - 0.9} y={y} width={1.8} height={h} fill={wall} opacity={0.5} />
      <rect x={x} y={y + h * 0.36} width={w} height={1.8} fill={wall} opacity={0.5} />
    </g>
  );
}

function Tower() {
  const cols = [44, 160, 276, 392, 508];
  const rows = [158, 264, 370, 476, 582, 688, 794];
  const lit = { r: 2, c: 3 };

  return (
    <svg
      viewBox="0 0 640 900"
      preserveAspectRatio="xMidYMin slice"
      className="block h-full w-full"
      focusable="false"
    >
      <rect width="640" height="900" fill={SKY} />
      <rect y="112" width="640" height="788" fill={WALL} />
      <rect y="98" width="640" height="15" fill={NAVY} opacity="0.9" />
      <rect y="119" width="640" height="3" fill={NAVY} opacity="0.1" />

      {/* light falls from the left — the last bay sits in shade */}
      <rect x="572" y="112" width="68" height="788" fill={NAVY} opacity="0.045" />

      {/* string courses between floors */}
      {rows.slice(1).map((y) => (
        <rect key={`s-${y}`} y={y - 12} width="640" height="1.5" fill={NAVY} opacity="0.07" />
      ))}

      {rows.map((y, r) =>
        cols.map((x, c) => (
          <Window key={`${r}-${c}`} x={x} y={y} w={88} h={88} lit={r === lit.r && c === lit.c} />
        ))
      )}

      <rect x="28" y="352" width="584" height="4" rx="2" fill={TEAL} opacity="0.5" />
      <rect x="28" y="670" width="584" height="4" rx="2" fill={TEAL} opacity="0.36" />

      <rect y="868" width="640" height="32" fill={WALL_DEEP} />
      <rect y="868" width="640" height="1.5" fill={NAVY} opacity="0.16" />
    </svg>
  );
}

function Terrace() {
  const leftCols = [34, 168, 302];
  const leftRows = [140, 258, 376];
  const rightCols = [458, 572, 686, 800];
  const rightRows = [162, 276, 390];

  return (
    <svg
      viewBox="0 0 900 600"
      preserveAspectRatio="xMidYMin slice"
      className="block h-full w-full"
      focusable="false"
    >
      <rect width="900" height="600" fill={SKY} />

      {/* two neighbouring façades meeting at a party wall */}
      <rect y="72" width="430" height="528" fill={WALL} />
      <rect x="430" y="104" width="470" height="496" fill={WALL_ALT} />
      <rect y="58" width="430" height="15" fill={NAVY} opacity="0.9" />
      <rect x="430" y="90" width="470" height="15" fill={NAVY} opacity="0.9" />
      <rect x="428" y="104" width="3.5" height="496" fill={NAVY} opacity="0.09" />

      {leftRows.map((y, r) =>
        leftCols.map((x, c) => (
          <Window key={`l-${r}-${c}`} x={x} y={y} w={96} h={86} lit={r === 1 && c === 1} />
        ))
      )}
      <rect x="20" y="228" width="392" height="4" rx="2" fill={TEAL} opacity="0.48" />

      {rightRows.map((y, r) =>
        rightCols.map((x, c) => {
          // the entrance replaces two windows on the ground floor
          if (r === 2 && (c === 1 || c === 2)) return null;
          return (
            <Window key={`r-${r}-${c}`} x={x} y={y} w={82} h={82} wall={WALL_ALT} />
          );
        })
      )}

      {/* entrance */}
      <rect x="586" y="390" width="150" height="166" rx="2" fill={NAVY} opacity="0.88" />
      <path d="M568 390h186l-20-26H588z" fill={TEAL} opacity="0.8" />

      <rect y="556" width="900" height="44" fill={WALL_DEEP} />
      <rect y="556" width="900" height="1.5" fill={NAVY} opacity="0.16" />
    </svg>
  );
}

function Court() {
  return (
    <svg
      viewBox="0 0 700 700"
      preserveAspectRatio="xMidYMid slice"
      className="block h-full w-full"
      focusable="false"
    >
      <rect width="700" height="700" fill={WALL} />
      <rect width="700" height="66" fill={SKY} />
      <rect y="54" width="700" height="13" fill={NAVY} opacity="0.9" />

      {/* the arch — the brand's halo, used as a real opening */}
      <path d="M262 648V400a88 88 0 0 1 176 0v248z" fill={WALL_DEEP} />
      <path
        d="M262 648V400a88 88 0 0 1 176 0v248"
        fill="none"
        stroke={NAVY}
        strokeWidth="4"
        opacity="0.3"
      />
      {/* courtyard beyond */}
      <rect x="286" y="424" width="128" height="224" fill={NAVY} opacity="0.09" />
      {[300, 348, 396].map((x) => (
        <rect key={x} x={x} y={452} width={26} height={40} rx={1.5} fill={NAVY} opacity="0.5" />
      ))}
      <rect x={348} y={528} width={26} height={40} rx={1.5} fill={SAND} opacity="0.75" />
      <rect x="308" y="600" width="9" height="48" fill={NAVY} opacity="0.4" />
      <circle cx="312" cy="586" r="26" fill={TEAL} opacity="0.35" />

      {/* flanking bays */}
      {[52, 156].map((x) =>
        [140, 268, 396].map((y) => (
          <Window key={`l-${x}-${y}`} x={x} y={y} w={82} h={86} lit={x === 156 && y === 268} />
        ))
      )}
      {[462, 566].map((x) =>
        [140, 268, 396].map((y) => (
          <Window key={`r-${x}-${y}`} x={x} y={y} w={82} h={86} />
        ))
      )}
      <rect x="36" y="244" width="222" height="4" rx="2" fill={TEAL} opacity="0.45" />
      <rect x="446" y="244" width="222" height="4" rx="2" fill={TEAL} opacity="0.45" />

      <rect y="648" width="700" height="52" fill={WALL_ALT} />
      <rect y="648" width="700" height="1.5" fill={NAVY} opacity="0.16" />
    </svg>
  );
}

export function Elevation({
  variant = "tower",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {variant === "tower" && <Tower />}
      {variant === "terrace" && <Terrace />}
      {variant === "court" && <Court />}
    </div>
  );
}
