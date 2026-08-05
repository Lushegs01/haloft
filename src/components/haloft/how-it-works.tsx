"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Check, ChevronDown, Footprints } from "lucide-react";
import { Elevation } from "./elevation";

const STEPS = [
  {
    n: "01",
    title: "Choose your university",
    body: "Haloft is organised by campus, not by city. Pick where you study and everything you see afterwards sits around it.",
  },
  {
    n: "02",
    title: "Compare your options",
    body: "Price, room type, walking distance and what's actually included — side by side, before you spend a morning travelling.",
  },
  {
    n: "03",
    title: "Find your next place",
    body: "Ask for an inspection on the home you want, with the details already on record. No fee to see an address.",
  },
];

/* ── Interface fragments ─────────────────────────────────────────── */

function SelectorFragment() {
  return (
    <div className="w-full max-w-[26rem] rounded-[14px] border border-[var(--line)] bg-card p-4 shadow-ambient">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        University
      </p>
      <div className="mt-2 flex items-center justify-between rounded-[10px] border border-[var(--teal-deep)] bg-[var(--teal-tint)] px-3.5 py-2.5">
        <span className="text-[15px] font-medium text-ink">FUNAAB — Abeokuta</span>
        <ChevronDown className="size-4 text-[var(--teal-deep)]" aria-hidden="true" />
      </div>
      <ul className="mt-3 space-y-2.5">
        {[
          { label: "University of Lagos", note: "Opening soon" },
          { label: "University of Ibadan", note: "Opening soon" },
        ].map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between text-[13px] text-muted-foreground"
          >
            <span>{row.label}</span>
            <span className="text-[10.5px] uppercase tracking-[0.12em]">{row.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ComparisonFragment() {
  const rows = [
    { label: "Per month", a: "₦65,000", b: "₦38,000" },
    { label: "Walk to campus", a: "11 min", b: "24 min" },
    { label: "Room type", a: "Self-contained", b: "Single room" },
    { label: "Water", a: true, b: true },
    { label: "Prepaid meter", a: true, b: false },
  ];

  return (
    <div className="w-full max-w-[30rem] overflow-hidden rounded-[14px] border border-[var(--line)] bg-card shadow-ambient">
      <div className="grid grid-cols-[1.1fr_1fr_1fr] items-end gap-3 border-b border-[var(--line)] px-4 pb-3 pt-4">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Compare
        </span>
        <span className="text-[13px] font-semibold text-ink">Greenview</span>
        <span className="text-[13px] font-semibold text-ink">Smiley Hostel</span>
      </div>
      <div className="divide-y divide-[var(--line)]">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1.1fr_1fr_1fr] items-center gap-3 px-4 py-2.5 text-[13px]"
          >
            <span className="text-muted-foreground">{row.label}</span>
            {[row.a, row.b].map((value, i) => (
              <span key={i} className="font-medium text-ink tabular">
                {typeof value === "boolean" ? (
                  value ? (
                    <Check className="size-4 text-[var(--teal-deep)]" aria-label="Included" />
                  ) : (
                    <span className="text-muted-foreground" aria-label="Not included">
                      —
                    </span>
                  )
                ) : (
                  value
                )}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function InspectionFragment() {
  return (
    <div className="w-full max-w-[26rem] overflow-hidden rounded-[14px] border border-[var(--line)] bg-card shadow-ambient">
      <div className="relative h-[124px] bg-[var(--paper-warm)]">
        <Elevation variant="terrace" />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[rgba(255,255,255,0.94)] px-2.5 py-1 text-[11px] font-medium text-[var(--teal-deep)]">
          <BadgeCheck className="size-3.5" aria-hidden="true" />
          Verified
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[15px] font-semibold text-ink">Greenview Hostel</p>
          <p className="text-[15px] font-semibold text-ink tabular">
            ₦65,000
            <span className="ml-1 text-[11px] font-normal text-muted-foreground">/mo</span>
          </p>
        </div>
        <p className="mt-1.5 flex items-center gap-2 text-[12.5px] text-muted-foreground">
          Alabata Road
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Footprints className="size-3.5 text-[var(--teal-deep)]" aria-hidden="true" />
            11 min walk
          </span>
        </p>
        <div
          className="mt-4 flex h-11 items-center justify-center rounded-[10px] bg-[var(--navy)] text-[13.5px] font-medium text-white"
          aria-hidden="true"
        >
          Request an inspection
        </div>
      </div>
    </div>
  );
}

const FRAGMENTS = [SelectorFragment, ComparisonFragment, InspectionFragment];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const refs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number((entry.target as HTMLElement).dataset.step);
          if (!Number.isNaN(index)) setActive(index);
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    refs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="chapter bg-[var(--paper)]" id="how-it-works">
      <div className="shell">
        <div className="grid grid-cols-12 gap-y-12 lg:gap-x-12">
          {/* Sticky rail */}
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <p className="label label-rule max-w-[14rem]">How Haloft works</p>
              <h2 className="mt-6 display-2 max-w-[11ch] text-ink">
                Three steps, in the order you&apos;d take them.
              </h2>

              <ol className="mt-9 hidden lg:block" aria-hidden="true">
                {STEPS.map((step, i) => (
                  <li key={step.n} className="flex items-center gap-3 py-2">
                    <span
                      className={`h-px transition-[width,background-color] duration-500 ${
                        active === i
                          ? "w-10 bg-[var(--teal-deep)]"
                          : "w-5 bg-[var(--line-strong)]"
                      }`}
                    />
                    <span
                      className={`text-[13px] transition-colors duration-300 ${
                        active === i ? "font-medium text-ink" : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Steps */}
          <div className="col-span-12 lg:col-span-8">
            <div className="flex flex-col gap-16 lg:gap-28">
              {STEPS.map((step, i) => {
                const Fragment = FRAGMENTS[i];
                return (
                  <div
                    key={step.n}
                    data-step={i}
                    ref={(node) => {
                      refs.current[i] = node;
                    }}
                    className="grid grid-cols-1 items-start gap-8 sm:grid-cols-[auto_1fr] sm:gap-x-8"
                  >
                    <p className="text-[13px] font-semibold text-[var(--teal-deep)] tabular sm:pt-1">
                      {step.n}
                    </p>

                    <div>
                      <h3 className="display-3 max-w-[16ch] text-ink">{step.title}</h3>
                      <p className="mt-4 max-w-[38ch] text-[15px] leading-[1.65] text-muted-foreground">
                        {step.body}
                      </p>

                      <figure
                        className={`mt-8 ${i === 1 ? "sm:-ml-4 lg:-ml-10" : ""} ${
                          i === 2 ? "sm:ml-6 lg:ml-12" : ""
                        }`}
                      >
                        <Fragment />
                        <figcaption className="sr-only">
                          Illustration of the Haloft interface for this step.
                        </figcaption>
                      </figure>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
