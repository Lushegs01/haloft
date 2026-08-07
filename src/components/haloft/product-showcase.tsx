import {
  BadgeCheck,
  Droplets,
  Footprints,
  Plug,
  ShieldCheck,
  Sofa,
} from "lucide-react";
import { Facade } from "./facade";
import { Reveal } from "./motion";

const ANNOTATIONS = [
  {
    title: "Know the price.",
    body: "What it costs per month, what's due up front, and whether anything sits on top.",
    offset: "lg:mt-2",
  },
  {
    title: "Know the distance.",
    body: "Placed against your campus gate, with a walking time you can sanity-check on a map.",
    offset: "lg:mt-24",
  },
  {
    title: "Know what you're getting.",
    body: "Room type, water, power, security, furnishing — listed, not implied.",
    offset: "lg:mt-24",
  },
];

const AMENITIES = [
  { icon: Droplets, label: "Water" },
  { icon: Plug, label: "Prepaid meter" },
  { icon: ShieldCheck, label: "Fenced" },
  { icon: Sofa, label: "Furnished" },
];

/** A miniature of a real Haloft property page — same components, same
 *  hierarchy, drawn at a smaller scale. */
function PropertyPageMock() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-card shadow-lifted">
      {/* Gallery */}
      <div className="grid h-[190px] grid-cols-3 gap-1 sm:h-[260px]">
        <div className="relative col-span-2 bg-[var(--paper-warm)]">
          <Facade variant="hostel" sizes="(max-width: 1024px) 62vw, 46vw" />
        </div>
        <div className="grid grid-rows-2 gap-1">
          <div className="relative bg-[var(--paper-warm)]">
            <Facade variant="court" sizes="(max-width: 1024px) 31vw, 23vw" />
          </div>
          <div className="relative bg-[var(--paper-warm)]">
            <Facade variant="terrace" sizes="(max-width: 1024px) 31vw, 23vw" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 p-5 sm:p-7 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
        {/* Left: the listing */}
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--teal-tint)] px-2.5 py-1 text-[11px] font-medium text-[var(--teal-deep)]">
              <BadgeCheck className="size-3.5" aria-hidden="true" />
              Verified by Haloft
            </span>
            <span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              Self-contained
            </span>
          </div>

          <h3 className="mt-4 text-[22px] font-semibold tracking-[-0.028em] text-ink sm:text-[26px]">
            Aster Studio — Camp
          </h3>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-muted-foreground">
            <span>14 Camp Road, Abeokuta</span>
            <span aria-hidden="true" className="text-[var(--line-strong)]">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Footprints className="size-3.5 text-[var(--teal-deep)]" aria-hidden="true" />
              6 min from FUNAAB main gate
            </span>
          </p>

          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3.5 border-t border-[var(--line)] pt-5 sm:grid-cols-4">
            {AMENITIES.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <item.icon className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
                <span className="whitespace-nowrap text-[12.5px] text-ink-soft">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-5 border-t border-[var(--line)] pt-5 text-[13.5px] leading-[1.65] text-muted-foreground">
            A single self-contained unit in a fenced compound off Camp Road.
            Tiled, own bathroom and kitchenette, prepaid meter on the unit.
            Water runs from a borehole on site.
          </p>
        </div>

        {/* Right: price + map */}
        <div className="lg:border-l lg:border-[var(--line)] lg:pl-8">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Rent
          </p>
          <p className="mt-1.5 text-[28px] font-semibold tracking-[-0.03em] text-ink tabular">
            ₦58,000
            <span className="ml-1.5 text-[13px] font-normal text-muted-foreground">
              / month
            </span>
          </p>

          {/* Map preview */}
          <div className="mt-5 overflow-hidden rounded-[12px] border border-[var(--line)]">
            <svg
              viewBox="0 0 320 170"
              className="h-[130px] w-full"
              role="img"
              aria-label="Map showing the property six minutes' walk from the campus gate"
            >
              <rect width="320" height="170" fill="#eceadf" />
              <g stroke="#dcd8c9" strokeWidth="8" strokeLinecap="square">
                <path d="M-10 46h340M-10 122h340M78 -10v190M212 -10v190" />
              </g>
              <g stroke="#e4e0d2" strokeWidth="3">
                <path d="M-10 84h340M146 -10v190M268 -10v190" />
              </g>
              <path
                d="M120 108 150 84l30 4 28-30"
                fill="none"
                stroke="#2a9d8f"
                strokeWidth="2.5"
                strokeDasharray="5 5"
                strokeLinecap="round"
              />
              <circle cx="208" cy="58" r="17" fill="#1a2a44" opacity="0.1" />
              <circle cx="208" cy="58" r="6" fill="#1a2a44" />
              <text x="208" y="38" textAnchor="middle" fill="#1a2a44" fontSize="10" fontWeight="600">
                FUNAAB
              </text>
              <path
                d="M120 108c0-7 5.5-12.5 12-12.5S144 101 144 108c0 8.5-12 20-12 20s-12-11.5-12-20z"
                fill="#e86530"
              />
              <circle cx="132" cy="107" r="4" fill="#fff" />
            </svg>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-4 text-[12.5px]">
            <span className="text-muted-foreground">Walk to gate</span>
            <span className="font-medium text-ink tabular">6 min · 480 m</span>
          </div>

          <div
            className="mt-5 flex h-12 items-center justify-center rounded-[10px] bg-[var(--navy)] text-[14px] font-medium text-white"
            aria-hidden="true"
          >
            Request an inspection
          </div>
          <p className="mt-3 text-center text-[11.5px] text-muted-foreground">
            No fee to see an address.
          </p>
        </div>
      </div>
    </div>
  );
}

export function ProductShowcase() {
  return (
    <section className="chapter bg-[var(--paper-warm)]" id="product">
      <div className="shell">
        <Reveal>
          <p className="label label-rule max-w-[16rem]">The listing page</p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="mt-6 display-2 max-w-[18ch] text-ink">
            Everything worth knowing, before you make the trip.
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-12 gap-y-10 lg:mt-16 lg:gap-x-10">
          {/* Annotations */}
          <div className="col-span-12 lg:col-span-3">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:block">
              {ANNOTATIONS.map((note) => (
                <Reveal key={note.title} className={`lg:mb-16 ${note.offset}`}>
                  <span
                    aria-hidden="true"
                    className="mb-3 block h-px w-8 bg-[var(--teal-deep)]"
                  />
                  <p className="text-[15px] font-semibold tracking-[-0.02em] text-ink">
                    {note.title}
                  </p>
                  <p className="mt-2 max-w-[24ch] text-[13px] leading-[1.6] text-muted-foreground">
                    {note.body}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>

          {/* The product */}
          <Reveal delay={0.1} className="col-span-12 lg:col-span-9">
            <PropertyPageMock />
            <p className="mt-4 text-[11.5px] text-muted-foreground">
              Interface shown with sample content.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
