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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Neighbourhood } from "@/types/database";

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-4 w-4" />,
  "24_7_power": <Zap className="h-4 w-4" />,
  generator: <Zap className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  kitchen: <Flame className="h-4 w-4" />,
  laundry: <WashingMachine className="h-4 w-4" />,
  parking: <Car className="h-4 w-4" />,
  study_room: <Building2 className="h-4 w-4" />,
  water_heater: <Droplets className="h-4 w-4" />,
  ac: <Fan className="h-4 w-4" />,
  gym: <Dumbbell className="h-4 w-4" />,
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

  const hasActiveFilters =
    currentFilters.neighbourhoodId ||
    currentFilters.propertyType ||
    currentFilters.minPrice ||
    currentFilters.maxPrice ||
    (currentFilters.amenities && currentFilters.amenities.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </h2>
        {hasActiveFilters && (
          <Link href={`/${campusSlug}/search`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          </Link>
        )}
      </div>

      {/* Neighbourhood */}
      <div>
        <h3 className="text-sm font-medium mb-3">Area</h3>
        <div className="space-y-1.5">
          {neighbourhoods.map((n) => (
            <Link
              key={n.id}
              href={buildHref({
                neighbourhood:
                  currentFilters.neighbourhoodId === n.id
                    ? undefined
                    : n.id,
              })}
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                currentFilters.neighbourhoodId === n.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {n.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Property Type */}
      <div>
        <h3 className="text-sm font-medium mb-3">Property Type</h3>
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((t) => (
            <Link
              key={t.value}
              href={buildHref({
                type:
                  currentFilters.propertyType === t.value
                    ? undefined
                    : t.value,
              })}
            >
              <Badge
                variant={
                  currentFilters.propertyType === t.value
                    ? "default"
                    : "outline"
                }
                className="cursor-pointer"
              >
                {t.label}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-medium mb-3">Price Range (₦/month)</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { min: undefined, max: undefined, label: "Any" },
            { min: undefined, max: "100000", label: "Under ₦100k" },
            { min: "100000", max: "200000", label: "₦100k – ₦200k" },
            { min: "200000", max: "300000", label: "₦200k – ₦300k" },
            { min: "300000", max: undefined, label: "₦300k+" },
          ].map((range) => (
            <Link
              key={range.label}
              href={buildHref({
                minPrice: range.min,
                maxPrice: range.max,
              })}
              className={`rounded-md px-3 py-2 text-sm text-center transition-colors ${
                String(currentFilters.minPrice ?? "") ===
                  (range.min ?? "") &&
                String(currentFilters.maxPrice ?? "") === (range.max ?? "")
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground border border-border"
              }`}
            >
              {range.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div>
        <h3 className="text-sm font-medium mb-3">Amenities</h3>
        <div className="space-y-1.5">
          {amenityOptions.map((a) => {
            const isActive =
              currentFilters.amenities?.includes(a.key) ?? false;
            return (
              <Link
                key={a.key}
                href={buildHref({
                  amenities: isActive
                    ? currentFilters.amenities
                        ?.filter((x) => x !== a.key)
                        .join(",") || undefined
                    : [...(currentFilters.amenities ?? []), a.key].join(","),
                })}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {amenityIcons[a.key] ?? null}
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
      <div className="text-center py-16 rounded-xl border border-dashed border-border bg-muted/30">
        <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No properties found</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Try adjusting your filters or search for something different. New properties are added weekly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {properties.length} {properties.length === 1 ? "property" : "properties"} found
      </p>
      <div className="grid grid-cols-1 gap-4">
        {properties.map((property) => (
          <Link
            key={property.id}
            href={`/${campusSlug}/property/${property.slug}`}
            className="group flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-primary/20"
          >
            <div className="relative aspect-[4/3] sm:w-48 sm:h-36 shrink-0 rounded-lg overflow-hidden bg-muted">
              {property.media_url ? (
                <Image
                  src={property.media_url}
                  alt={property.title ?? "Property"}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, 192px"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Building2 className="h-8 w-8 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                    {property.title}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {property.address}
                    </span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-primary">
                    ₦{property.min_price?.toLocaleString() ?? "N/A"}
                  </p>
                  <p className="text-xs text-muted-foreground">/month</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber text-amber" />
                  <span className="text-sm font-medium">
                    {property.avg_rating ?? "New"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({property.review_count ?? 0} reviews)
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {property.available_rooms} available
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {(property.amenities ?? [])
                  .slice(0, 5)
                  .map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                    >
                      {amenityIcons[amenity] ?? null}
                      {amenity.replace(/_/g, " ")}
                    </span>
                  ))}
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
    <div className="space-y-4">
      <Skeleton className="h-4 w-32" />
      <div className="grid grid-cols-1 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4"
          >
            <Skeleton className="aspect-[4/3] sm:w-48 sm:h-36 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex gap-1.5">
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
