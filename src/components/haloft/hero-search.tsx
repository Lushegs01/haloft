"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Search, MapPin, Building2, Wallet } from "lucide-react";
import type { UniversityCard } from "@/data/marketplace";

const PROPERTY_TYPES = [
  { value: "", label: "Any type" },
  { value: "hostel", label: "Hostel" },
  { value: "self_contained", label: "Self-contained" },
  { value: "studio", label: "Studio" },
  { value: "apartment", label: "Apartment" },
  { value: "single_room", label: "Single room" },
];

const BUDGETS = [
  { value: "", label: "Any budget" },
  { value: "30000", label: "Under ₦30k/mo" },
  { value: "50000", label: "Under ₦50k/mo" },
  { value: "80000", label: "Under ₦80k/mo" },
  { value: "120000", label: "Under ₦120k/mo" },
];

export function HeroSearch({ universities }: { universities: UniversityCard[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [university, setUniversity] = useState("");
  const [keyword, setKeyword] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [budget, setBudget] = useState("");

  const liveUniversities = universities.filter((u) => u.status === "live");

  function submit(e: FormEvent) {
    e.preventDefault();
    const campus = university || liveUniversities[0]?.slug;
    if (!campus) return;
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (propertyType) params.set("type", propertyType);
    if (budget) params.set("maxPrice", budget);
    startTransition(() => {
      router.push(`/${campus}/search${params.toString() ? `?${params.toString()}` : ""}`);
    });
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto w-full max-w-3xl rounded-2xl border border-border bg-white p-2 shadow-[0_20px_60px_-20px_rgba(26,42,68,0.25)] sm:rounded-3xl sm:p-3"
      aria-label="Search student housing"
    >
      <div className="grid gap-2 sm:grid-cols-[1.3fr_1fr_1fr]">
        <label className="flex items-center gap-2.5 rounded-xl bg-background px-3.5 py-2.5">
          <MapPin className="size-4.5 shrink-0 text-primary" aria-hidden="true" />
          <select
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="w-full cursor-pointer bg-transparent text-sm font-semibold text-foreground outline-none [&>option]:text-foreground"
            aria-label="University"
          >
            <option value="">Any university</option>
            {liveUniversities.map((u) => (
              <option key={u.id} value={u.slug}>
                {u.shortName} — {u.city}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2.5 rounded-xl bg-background px-3.5 py-2.5">
          <Building2 className="size-4.5 shrink-0 text-teal-ink" aria-hidden="true" />
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full cursor-pointer bg-transparent text-sm font-semibold text-foreground outline-none [&>option]:text-foreground"
            aria-label="Property type"
          >
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2.5 rounded-xl bg-background px-3.5 py-2.5">
          <Wallet className="size-4.5 shrink-0 text-coral" aria-hidden="true" />
          <select
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full cursor-pointer bg-transparent text-sm font-semibold text-foreground outline-none [&>option]:text-foreground"
            aria-label="Monthly budget"
          >
            {BUDGETS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex flex-1 items-center gap-2.5 rounded-xl border border-border bg-white px-3.5 py-2.5">
          <Search className="size-4.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Try “self-contained”, “Toll Gate”…"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            aria-label="Keyword"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition-all hover:brightness-110 disabled:opacity-60"
        >
          <Search className="size-4" aria-hidden="true" />
          {isPending ? "Searching…" : "Search homes"}
        </button>
      </div>
    </form>
  );
}
