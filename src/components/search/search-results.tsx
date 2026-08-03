"use client";

import { useState } from "react";
import { getCampusProperties } from "@/lib/data/campus";
import { walkMinutes } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  MapPin,
  Star,
  SlidersHorizontal,
  Wifi,
  Shield,
  Droplets,
  Car,
  WashingMachine,
  Fan,
  Zap,
  Flame,
  Dumbbell,
  X,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Heart,
  Hotel,
  Home,
  Users,
  BedDouble,
  Layers,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Neighbourhood } from "@/types/database";

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-3.5 w-3.5" />,
  "24_7_power": <Zap className="h-3.5 w-3.5" />,
  generator: <Zap className="h-3.5 w-3.5" />,
  security: <Shield className="h-3.5 w-3.5" />,
  kitchen: <Flame className="h-3.5 w-3.5" />,
  laundry: <WashingMachine className="h-3.5 w-3.5" />,
  parking: <Car className="h-3.5 w-3.5" />,
  study_room: <Building2 className="h-3.5 w-3.5" />,
  water_heater: <Droplets className="h-3.5 w-3.5" />,
  ac: <Fan className="h-3.5 w-3.5" />,
  gym: <Dumbbell className="h-3.5 w-3.5" />,
};

const typeIcons: Record<string, React.ReactNode> = {
  hostel: <Hotel className="h-4 w-4" />,
  apartment: <Home className="h-4 w-4" />,
  shared_house: <Users className="h-4 w-4" />,
  single_room: <BedDouble className="h-4 w-4" />,
  self_contained: <Layers className="h-4 w-4" />,
  studio: <LayoutGrid className="h-4 w-4" />,
};

interface SearchFiltersProps {
  campusSlug: string;
  neighbourhoods: Neighbourhood[];
  currentFilters: {
    neighbourhoodId?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string[];
    search?: string;
  };
}

export function SearchFilters({
  campusSlug,
  neighbourhoods,
  currentFilters,
}: SearchFiltersProps) {
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");

  const amenityOptions = [
    { key: "wifi", label: "Wi-Fi" },
    { key: "24_7_power", label: "24/7 Power" },
    { key: "security", label: "Security" },
    { key: "kitchen", label: "Kitchen" },
    { key: "laundry", label: "Laundry" },
    { key: "parking", label: "Parking" },
    { key: "water_heater", label: "Water Heater" },
    { key: "ac", label: "Air Conditioning" },
  ];

  const typeOptions = [
    { value: "hostel", label: "Hostel" },
    { value: "apartment", label: "Apartment" },
    { value: "shared_house", label: "Shared House" },
    { value: "single_room", label: "Single Room" },
    { value: "self_contained", label: "Self Contained" },
    { value: "studio", label: "Studio" },
  ];

  const buildHref = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const base = { ...currentFilters, ...updates };
    Object.entries(base).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        if (Array.isArray(value)) {
          params.set(key, value.join(","));
        } else {
          params.set(key, String(value));
        }
      }
    });
    return `/${campusSlug}/search?${params.toString()}`;
  };

  const activeCount =
    (currentFilters.neighbourhoodId ? 1 : 0) +
    (currentFilters.propertyType ? 1 : 0) +
    (currentFilters.minPrice || currentFilters.maxPrice ? 1 : 0) +
    (currentFilters.amenities?.length ?? 0);

  const handleCustomPrice = () => {
    if (customMin || customMax) {
      window.location.href = buildHref({
        minPrice: customMin || undefined,
        maxPrice: customMax || undefined,
      });
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-6 lg:sticky lg:top-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-foreground flex items-center gap-2" style={{ fontFamily: "var(--font-inter)" }}>
          <SlidersHorizontal className="h-4 w-4 text-primary" />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </h2>
        {activeCount > 0 && (
          <Link href={`/${campusSlug}/search`}>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-destructive h-8 text-xs">
              <X className="h-3 w-3" />
              Clear all
            </Button>
          </Link>
        )}
      </div>

      {/* Area */}
      {neighbourhoods.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Area</h3>
          <div className="space-y-1">
            {neighbourhoods.map((n) => (
              <Link
                key={n.id}
                href={buildHref({
                  neighbourhood:
                    currentFilters.neighbourhoodId === n.id ? undefined : n.id,
                })}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  currentFilters.neighbourhoodId === n.id
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${currentFilters.neighbourhoodId === n.id ? "bg-primary" : "bg-muted-foreground/30"}`} />
                {n.name}
                {currentFilters.neighbourhoodId === n.id && (
                  <CheckCircle2 className="h-3.5 w-3.5 ml-auto text-primary" />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Property Type — icon chips in 3-col grid */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Property Type</h3>
        <div className="grid grid-cols-3 gap-2">
          {typeOptions.map((t) => {
            const isActive = currentFilters.propertyType === t.value;
            return (
              <Link
                key={t.value}
                href={buildHref({
                  type: isActive ? undefined : t.value,
                })}
                className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium transition-all border ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary bg-card"
                }`}
              >
                <span className={isActive ? "text-primary-foreground" : "text-muted-foreground/60"}>
                  {typeIcons[t.value]}
                </span>
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Price (₦/month)</h3>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { min: undefined, max: undefined, label: "Any price" },
            { min: undefined, max: "100000", label: "Under ₦100k" },
            { min: "100000", max: "200000", label: "₦100k–₦200k" },
            { min: "200000", max: "300000", label: "₦200k–₦300k" },
            { min: "300000", max: undefined, label: "₦300k+" },
          ].map((range) => {
            const isActive =
              String(currentFilters.minPrice ?? "") === (range.min ?? "") &&
              String(currentFilters.maxPrice ?? "") === (range.max ?? "");
            return (
              <Link
                key={range.label}
                href={buildHref({ minPrice: range.min, maxPrice: range.max })}
                className={`rounded-xl px-3 py-2 text-xs text-center transition-all border font-medium ${
                  isActive
                    ? "bg-primary/10 text-primary border-primary/30 font-semibold"
                    : "text-muted-foreground border-border hover:border-primary/30 hover:text-primary bg-card"
                }`}
              >
                {range.label}
              </Link>
            );
          })}
        </div>
        {/* Custom price inputs */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={customMin}
            onChange={(e) => setCustomMin(e.target.value)}
            className="flex-1 h-9 rounded-lg border border-border bg-muted/30 px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
          />
          <span className="text-muted-foreground text-xs">—</span>
          <input
            type="number"
            placeholder="Max"
            value={customMax}
            onChange={(e) => setCustomMax(e.target.value)}
            className="flex-1 h-9 rounded-lg border border-border bg-muted/30 px-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
          />
          <Button size="sm" className="h-9 px-3 text-xs rounded-lg" onClick={handleCustomPrice}>
            Apply
          </Button>
        </div>
      </div>

      {/* Amenities — icon grid 2 per row */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Amenities</h3>
        <div className="grid grid-cols-2 gap-2">
          {amenityOptions.map((a) => {
            const isActive = currentFilters.amenities?.includes(a.key) ?? false;
            return (
              <Link
                key={a.key}
                href={buildHref({
                  amenities: isActive
                    ? currentFilters.amenities?.filter((x) => x !== a.key).join(",") || undefined
                    : [...(currentFilters.amenities ?? []), a.key].join(","),
                })}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs transition-all border ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary font-semibold"
                    : "text-muted-foreground border-border hover:border-primary/40 hover:text-primary bg-card"
                }`}
              >
                <span className={isActive ? "text-primary-foreground" : "text-muted-foreground/50"}>
                  {amenityIcons[a.key] ?? null}
                </span>
                {a.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface SearchResultsProps {
  campusId: string;
  campusSlug: string;
  campusLat?: number | null;
  campusLng?: number | null;
  filters: {
    neighbourhoodId?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string[];
    search?: string;
  };
  page?: number;
  queryParams?: Record<string, string | string[] | undefined>;
}

export async function SearchResults({
  campusId,
  campusSlug,
  campusLat,
  campusLng,
  filters,
  page = 1,
  queryParams = {},
}: SearchResultsProps) {
  const { properties, total, pageSize } = await getCampusProperties(
    campusId,
    filters,
    page
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(queryParams)) {
      if (k === "page" || v === undefined) continue;
      params.set(k, Array.isArray(v) ? v.join(",") : v);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/${campusSlug}/search${qs ? `?${qs}` : ""}`;
  };

  if (properties.length === 0) {
    return (
      <div className="text-center py-20 rounded-2xl border border-dashed border-border bg-muted/20">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-5">
          <Building2 className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-inter)" }}>
          No properties found
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
          Try adjusting your filters or search for something different. New properties are added weekly.
        </p>
        <Link href={`/${campusSlug}/search`}>
          <Button variant="outline" className="rounded-full">Clear filters</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{total}</span>{" "}
          {total === 1 ? "property" : "properties"} found
          {totalPages > 1 && (
            <span className="text-muted-foreground/70"> · page {page} of {totalPages}</span>
          )}
        </p>
        <div className="flex items-center gap-3">
          <button className="hidden sm:inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40 transition-all">
            <MapPin className="h-3.5 w-3.5" />
            Map
          </button>
          <div className="relative">
            <button className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40 transition-all">
              Sort by <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Property grid — 3 cols on desktop, 2 on sm, 1 on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {properties.map((property, index) => {
          const minutes =
            campusLat != null &&
            campusLng != null &&
            property.latitude != null &&
            property.longitude != null
              ? walkMinutes(
                  Number(property.latitude),
                  Number(property.longitude),
                  Number(campusLat),
                  Number(campusLng)
                )
              : null;
          const title = property.title ?? "Property";
          const address = property.address ?? "";
          const minPrice = property.min_price ?? 0;
          const rating = property.avg_rating ?? "New";
          const reviewCount = property.review_count ?? 0;
          const availableRooms = property.available_rooms ?? 0;
          const propertyType = property.property_type?.replace(/_/g, " ") ?? "";

          return (
            <Link
              key={property.id}
              href={`/${campusSlug}/property/${property.slug}`}
              className="group animate-fade-in"
              style={{ animationDelay: `${(index % 4) * 0.05}s` }}
            >
              {/* Image container */}
              <div className="property-card-img relative mb-3 overflow-hidden rounded-3xl ring-1 ring-border transition-shadow duration-300 group-hover:shadow-premium">
                {property.media_url ? (
                  <Image
                    src={property.media_url}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/40">
                    <Building2 className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                {/* Save/heart button */}
                <button
                  className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
                  onClick={(e) => e.preventDefault()}
                  aria-label="Save property"
                >
                  <Heart className="h-4 w-4 text-foreground/80 transition-colors hover:text-primary" />
                </button>
                {/* Verified badge */}
                <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-night/85 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                  <CheckCircle2 className="h-3 w-3 text-teal" />
                  Verified
                </span>
                {/* Walk time */}
                {minutes !== null && (
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                    <MapPin className="h-3 w-3" />
                    ≈ {minutes} min walk
                  </span>
                )}
                {/* Price pill */}
                <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-[13px] font-extrabold text-foreground shadow-sm backdrop-blur-sm">
                  ₦{minPrice.toLocaleString()}
                  <span className="text-[10px] font-semibold text-muted-foreground"> /mo</span>
                </span>
              </div>

              {/* Card info below image */}
              <div className="space-y-1 px-0.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                    {title}
                  </h3>
                  <div className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                    <Star className="h-3 w-3 fill-amber text-amber" />
                    <span className="text-xs font-semibold">{rating}</span>
                  </div>
                </div>
                <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {address}
                </p>
                <p className="text-sm text-muted-foreground">
                  {availableRooms} {availableRooms === 1 ? "room" : "rooms"} · {propertyType}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-center gap-2 pt-4"
          aria-label="Search results pages"
        >
          {page > 1 ? (
            <Link
              href={pageHref(page - 1)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40 transition-colors no-underline"
              rel="prev"
            >
              Previous
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground/50 cursor-not-allowed">
              Previous
            </span>
          )}
          <span className="px-3 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={pageHref(page + 1)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary/40 transition-colors no-underline"
              rel="next"
            >
              Next
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-4 py-2 text-sm font-medium text-muted-foreground/50 cursor-not-allowed">
              Next
            </span>
          )}
        </nav>
      )}
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-4 w-36 shimmer" />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
            <Skeleton className="property-card-img w-full shimmer" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4 shimmer" />
              <Skeleton className="h-4 w-1/2 shimmer" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-16 shimmer" />
                <Skeleton className="h-4 w-16 shimmer" />
              </div>
              <div className="flex gap-1.5">
                <Skeleton className="h-6 w-16 rounded-lg shimmer" />
                <Skeleton className="h-6 w-16 rounded-lg shimmer" />
                <Skeleton className="h-6 w-16 rounded-lg shimmer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
