"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { UniversityCard } from "@/data/marketplace";

const PROPERTY_TYPES = [
  { value: "", label: "Any type" },
  { value: "self_contained", label: "Self-contained" },
  { value: "single_room", label: "Single room" },
  { value: "hostel", label: "Hostel" },
  { value: "studio", label: "Studio" },
  { value: "apartment", label: "Apartment" },
  { value: "shared_house", label: "Shared flat" },
];

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block whitespace-nowrap text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
    >
      {children}
    </label>
  );
}

/**
 * The hero's search bar. Three decisions a student actually starts from —
 * where they study, roughly where they want to live, and what kind of
 * place — handed straight to the campus search route.
 */
export function HeroSearch({
  universities,
  className = "",
}: {
  universities: UniversityCard[];
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const uid = useId();

  const live = universities.filter((u) => u.status === "live");
  const [campus, setCampus] = useState(live[0]?.slug ?? "");
  const [area, setArea] = useState("");
  const [propertyType, setPropertyType] = useState("");

  const uniId = `${uid}-uni`;
  const areaId = `${uid}-area`;
  const typeId = `${uid}-type`;
  const disabled = isPending || live.length === 0;

  function submit(event: FormEvent) {
    event.preventDefault();
    const target = campus || live[0]?.slug;
    if (!target) return;

    const params = new URLSearchParams();
    if (area.trim()) params.set("q", area.trim());
    if (propertyType) params.set("type", propertyType);
    const query = params.toString();

    startTransition(() => {
      router.push(`/${target}/search${query ? `?${query}` : ""}`);
    });
  }

  return (
    <form
      onSubmit={submit}
      aria-label="Search student accommodation"
      className={`rounded-[16px] border border-[var(--line)] bg-card p-1.5 shadow-ambient ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-[1.22fr_1fr_1fr_auto]">
        {/* University */}
        <div className="rounded-[11px] px-4 py-3 transition-colors focus-within:bg-[var(--paper)]">
          <FieldLabel htmlFor={uniId}>University</FieldLabel>
          <div className="relative mt-1 flex items-center">
            <select
              id={uniId}
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              className="-my-2 w-full cursor-pointer appearance-none truncate bg-transparent py-2 pr-6 text-[15px] font-medium text-ink outline-none"
            >
              {live.length === 0 && <option value="">No campuses live yet</option>}
              {live.map((u) => (
                <option key={u.id} value={u.slug}>
                  {u.shortName} — {u.city}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-0 size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Area */}
        <div className="rounded-[11px] border-t border-[var(--line)] px-4 py-3 transition-colors focus-within:bg-[var(--paper)] sm:border-l sm:border-t-0">
          <FieldLabel htmlFor={areaId}>Area</FieldLabel>
          <input
            id={areaId}
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Camp, Alabata…"
            autoComplete="off"
            className="-mb-2 mt-1 w-full bg-transparent py-2 text-[15px] font-medium text-ink outline-none placeholder:font-normal placeholder:text-muted-foreground/75"
          />
        </div>

        {/* Home type */}
        <div className="rounded-[11px] border-t border-[var(--line)] px-4 py-3 transition-colors focus-within:bg-[var(--paper)] sm:border-l sm:border-t-0">
          <FieldLabel htmlFor={typeId}>Home type</FieldLabel>
          <div className="relative mt-1 flex items-center">
            <select
              id={typeId}
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="-my-2 w-full cursor-pointer appearance-none truncate bg-transparent py-2 pr-6 text-[15px] font-medium text-ink outline-none"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-0 size-4 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="mt-1.5 sm:ml-1.5 sm:mt-0 sm:flex sm:items-stretch">
          <button
            type="submit"
            disabled={disabled}
            className="group inline-flex h-13 w-full items-center justify-center gap-2 rounded-[11px] bg-[var(--navy)] px-6 text-[14.5px] font-medium text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-45 sm:h-auto"
          >
            <Search className="size-[17px]" aria-hidden="true" />
            <span>{isPending ? "Searching…" : "Find a place"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
