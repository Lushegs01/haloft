import { getCampusProperties } from "@/lib/data/campus";
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

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-6">
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
                <MapPin className={`h-3.5 w-3.5 shrink-0 ${currentFilters.neighbourhoodId === n.id ? "text-primary" : "text-muted-foreground/50"}`} />
                {n.name}
                {currentFilters.neighbourhoodId === n.id && (
                  <CheckCircle2 className="h-3.5 w-3.5 ml-auto text-primary" />
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Property Type */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Property Type</h3>
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((t) => (
            <Link
              key={t.value}
              href={buildHref({
                type:
                  currentFilters.propertyType === t.value ? undefined : t.value,
              })}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all border ${
                currentFilters.propertyType === t.value
                  ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/25"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary bg-card"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Price (₦/month)</h3>
        <div className="grid grid-cols-2 gap-2">
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
      </div>

      {/* Amenities */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Amenities</h3>
        <div className="space-y-1">
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
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className={isActive ? "text-primary" : "text-muted-foreground/50"}>
                  {amenityIcons[a.key] ?? null}
                </span>
                {a.label}
                {isActive && <CheckCircle2 className="h-3.5 w-3.5 ml-auto text-primary" />}
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
  filters: {
    neighbourhoodId?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string[];
    search?: string;
  };
}

export async function SearchResults({
  campusId,
  campusSlug,
  filters,
}: SearchResultsProps) {
  const properties = await getCampusProperties(campusId, filters);

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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{properties.length}</span>{" "}
          {properties.length === 1 ? "property" : "properties"} found
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-5">
        {properties.map((property) => (
          <Link
            key={property.id}
            href={`/${campusSlug}/property/${property.slug}`}
            className="group rounded-2xl border border-border bg-card overflow-hidden transition-all hover:shadow-xl hover:shadow-black/8 hover:-translate-y-0.5 flex flex-col"
          >
            {/* Image */}
            <div className="relative aspect-[16/9] bg-muted overflow-hidden shrink-0">
              {property.media_url ? (
                <Image
                  src={property.media_url}
                  alt={property.title ?? "Property"}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 400px"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Building2 className="h-10 w-10 text-muted-foreground/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

              {/* Verified badge */}
              <div className="absolute top-3 left-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-success/90 backdrop-blur-sm px-2 py-1 text-[11px] font-semibold text-white">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </span>
              </div>

              {/* Price overlay */}
              <div className="absolute bottom-3 right-3">
                <div className="rounded-lg bg-black/55 backdrop-blur-sm px-3 py-1.5 text-right">
                  <p className="text-white font-bold text-sm">₦{property.min_price?.toLocaleString() ?? "N/A"}</p>
                  <p className="text-white/70 text-[10px]">/month</p>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3
                  className="font-semibold text-foreground group-hover:text-primary transition-colors leading-snug"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {property.title}
                </h3>
              </div>

              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{property.address}</span>
              </p>

              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber text-amber" />
                  <span className="text-sm font-semibold text-foreground">
                    {property.avg_rating ?? "New"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({property.review_count ?? 0})
                  </span>
                </div>
                <span className="text-border">·</span>
                <span className="text-xs text-muted-foreground font-medium">
                  {property.available_rooms} room{property.available_rooms !== 1 ? "s" : ""} available
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-auto">
                {(property.amenities ?? []).slice(0, 4).map((amenity) => (
                  <span
                    key={amenity}
                    className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground"
                  >
                    {amenityIcons[amenity] ?? null}
                    {amenity.replace(/_/g, " ")}
                  </span>
                ))}
                {(property.amenities ?? []).length > 4 && (
                  <span className="inline-flex items-center rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">
                    +{(property.amenities ?? []).length - 4}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-4 w-36" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
            <Skeleton className="aspect-[16/9] w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex gap-1.5">
                <Skeleton className="h-6 w-16 rounded-lg" />
                <Skeleton className="h-6 w-16 rounded-lg" />
                <Skeleton className="h-6 w-16 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
