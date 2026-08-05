"use client";

import { useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import type { Neighbourhood } from "@/types/database";

const TYPE_OPTIONS = [
  { value: "self_contained", label: "Self-contained" },
  { value: "single_room", label: "Single room" },
  { value: "hostel", label: "Hostel" },
  { value: "studio", label: "Studio" },
  { value: "apartment", label: "Apartment" },
  { value: "shared_house", label: "Shared flat" },
];

const AMENITY_OPTIONS = [
  { key: "24_7_power", label: "24/7 power" },
  { key: "generator", label: "Generator" },
  { key: "security", label: "Security" },
  { key: "water_heater", label: "Running water" },
  { key: "kitchen", label: "Kitchen" },
  { key: "wifi", label: "Wi-Fi" },
  { key: "laundry", label: "Laundry" },
  { key: "parking", label: "Parking" },
  { key: "study_room", label: "Study room" },
  { key: "ac", label: "Air conditioning" },
];

const PRICE_RANGES = [
  { min: undefined, max: undefined, label: "Any price" },
  { min: undefined, max: "100000", label: "Under ₦100k" },
  { min: "100000", max: "200000", label: "₦100k–₦200k" },
  { min: "200000", max: "300000", label: "₦200k–₦300k" },
  { min: "300000", max: undefined, label: "₦300k and up" },
];

interface Filters {
  neighbourhoodId?: string;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  search?: string;
}

interface SearchFiltersProps {
  campusSlug: string;
  neighbourhoods: Neighbourhood[];
  currentFilters: Filters;
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`inline-flex h-9 items-center rounded-[9px] border px-3 text-[13px] font-medium transition-colors ${
        active
          ? "border-[var(--navy)] bg-[var(--navy)] text-white"
          : "border-[var(--line-strong)] text-ink-soft hover:border-[var(--ink-soft)] hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[var(--line)] pt-5">
      <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </h3>
      <div className="mt-3.5">{children}</div>
    </div>
  );
}

/**
 * Filters stay link-driven: every option is a real URL, so results are
 * shareable, back/forward works, and the page filters fine before any
 * JavaScript arrives.
 */
export function SearchFilters({
  campusSlug,
  neighbourhoods,
  currentFilters,
}: SearchFiltersProps) {
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");

  const buildHref = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const base: Record<string, string | string[] | number | undefined> = {
      neighbourhood: currentFilters.neighbourhoodId,
      type: currentFilters.propertyType,
      minPrice: currentFilters.minPrice,
      maxPrice: currentFilters.maxPrice,
      amenities: currentFilters.amenities,
      q: currentFilters.search,
      ...updates,
    };
    Object.entries(base).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === null) return;
      params.set(key, Array.isArray(value) ? value.join(",") : String(value));
    });
    const query = params.toString();
    return `/${campusSlug}/search${query ? `?${query}` : ""}`;
  };

  const activeCount =
    (currentFilters.neighbourhoodId ? 1 : 0) +
    (currentFilters.propertyType ? 1 : 0) +
    (currentFilters.minPrice || currentFilters.maxPrice ? 1 : 0) +
    (currentFilters.amenities?.length ?? 0);

  const customHref = buildHref({
    minPrice: customMin || undefined,
    maxPrice: customMax || undefined,
  });

  const body = (
    <div className="space-y-6">
      {neighbourhoods.length > 0 && (
        <Group title="Area">
          <div className="flex flex-wrap gap-2">
            {neighbourhoods.map((n) => {
              const active = currentFilters.neighbourhoodId === n.id;
              return (
                <FilterChip
                  key={n.id}
                  active={active}
                  href={buildHref({ neighbourhood: active ? undefined : n.id })}
                >
                  {n.name}
                </FilterChip>
              );
            })}
          </div>
        </Group>
      )}

      <Group title="Home type">
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((t) => {
            const active = currentFilters.propertyType === t.value;
            return (
              <FilterChip
                key={t.value}
                active={active}
                href={buildHref({ type: active ? undefined : t.value })}
              >
                {t.label}
              </FilterChip>
            );
          })}
        </div>
      </Group>

      <Group title="Rent per month">
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.map((range) => {
            const active =
              String(currentFilters.minPrice ?? "") === (range.min ?? "") &&
              String(currentFilters.maxPrice ?? "") === (range.max ?? "");
            return (
              <FilterChip
                key={range.label}
                active={active}
                href={buildHref({ minPrice: range.min, maxPrice: range.max })}
              >
                {range.label}
              </FilterChip>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <label className="sr-only" htmlFor="price-min">
            Minimum rent
          </label>
          <input
            id="price-min"
            type="number"
            inputMode="numeric"
            placeholder="Min"
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            className="h-10 w-full min-w-0 rounded-[9px] border border-[var(--line-strong)] bg-card px-3 text-[13px] text-ink outline-none transition-colors focus:border-[var(--teal-deep)]"
          />
          <span aria-hidden="true" className="text-muted-foreground">—</span>
          <label className="sr-only" htmlFor="price-max">
            Maximum rent
          </label>
          <input
            id="price-max"
            type="number"
            inputMode="numeric"
            placeholder="Max"
            value={customMax}
            onChange={(e) => setCustomMax(e.target.value)}
            className="h-10 w-full min-w-0 rounded-[9px] border border-[var(--line-strong)] bg-card px-3 text-[13px] text-ink outline-none transition-colors focus:border-[var(--teal-deep)]"
          />
          <Link
            href={customHref}
            aria-disabled={!customMin && !customMax}
            className={`inline-flex h-10 shrink-0 items-center rounded-[9px] px-3.5 text-[13px] font-medium transition-colors ${
              customMin || customMax
                ? "bg-[var(--navy)] text-white hover:bg-[var(--primary-hover)]"
                : "pointer-events-none bg-[var(--muted)] text-muted-foreground"
            }`}
          >
            Apply
          </Link>
        </div>
      </Group>

      <Group title="Must have">
        <div className="flex flex-wrap gap-2">
          {AMENITY_OPTIONS.map((a) => {
            const active = currentFilters.amenities?.includes(a.key) ?? false;
            const next = active
              ? currentFilters.amenities?.filter((x) => x !== a.key)
              : [...(currentFilters.amenities ?? []), a.key];
            return (
              <FilterChip
                key={a.key}
                active={active}
                href={buildHref({
                  amenities: next && next.length ? next.join(",") : undefined,
                })}
              >
                {a.label}
              </FilterChip>
            );
          })}
        </div>
      </Group>
    </div>
  );

  const header = (
    <div className="flex items-center justify-between gap-4">
      <p className="inline-flex items-center gap-2 text-[13.5px] font-medium text-ink">
        <SlidersHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
        Filters
        {activeCount > 0 && (
          <span className="inline-flex size-5 items-center justify-center rounded-full bg-[var(--navy)] text-[10.5px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </p>
      {activeCount > 0 && (
        <Link
          href={`/${campusSlug}/search${
            currentFilters.search ? `?q=${encodeURIComponent(currentFilters.search)}` : ""
          }`}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-ink"
        >
          <X className="size-3.5" aria-hidden="true" />
          Clear all
        </Link>
      )}
    </div>
  );

  return (
    <>
      {/* Small screens: a disclosure so results stay above the fold */}
      <details className="rounded-[12px] border border-[var(--line)] bg-card px-4 py-3 lg:hidden">
        <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
          {header}
        </summary>
        <div className="mt-5">{body}</div>
      </details>

      {/* Desktop: a column, not a box */}
      <div className="hidden lg:sticky lg:top-24 lg:block">
        {header}
        <div className="mt-5">{body}</div>
      </div>
    </>
  );
}

export function SearchSkeleton() {
  return (
    <div>
      <div className="h-4 w-40 rounded shimmer" />
      <div className="mt-8 grid grid-cols-1 gap-x-7 gap-y-11 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}>
            <div className="aspect-[4/3] w-full rounded-[14px] shimmer" />
            <div className="mt-4 space-y-2.5">
              <div className="h-4 w-3/4 rounded shimmer" />
              <div className="h-3 w-1/2 rounded shimmer" />
              <div className="h-3 w-2/3 rounded shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
