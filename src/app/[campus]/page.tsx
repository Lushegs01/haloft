import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Roofline } from "@/components/ui/roofline";
import {
  Search,
  MapPin,
  Building2,
  Star,
  ArrowRight,
  Wifi,
  Shield,
  Droplets,
  Car,
  WashingMachine,
  Fan,
  Zap,
  Flame,
  Dumbbell,
  Hotel,
  Home,
  Users,
  BedDouble,
  Layers,
  LayoutGrid,
  CheckCircle2,
  Heart,
} from "lucide-react";

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-3.5 w-3.5" />,
  "24_7_power": <Zap className="h-3.5 w-3.5" />,
  security: <Shield className="h-3.5 w-3.5" />,
  kitchen: <Flame className="h-3.5 w-3.5" />,
  laundry: <WashingMachine className="h-3.5 w-3.5" />,
  parking: <Car className="h-3.5 w-3.5" />,
  study_room: <Building2 className="h-3.5 w-3.5" />,
  water_heater: <Droplets className="h-3.5 w-3.5" />,
  ac: <Fan className="h-3.5 w-3.5" />,
  gym: <Dumbbell className="h-3.5 w-3.5" />,
};

const propertyTypeConfig = [
  { value: "hostel", label: "Hostel", icon: Hotel },
  { value: "apartment", label: "Apartment", icon: Home },
  { value: "shared_house", label: "Shared House", icon: Users },
  { value: "single_room", label: "Single Room", icon: BedDouble },
  { value: "self_contained", label: "Self Contained", icon: Layers },
  { value: "studio", label: "Studio", icon: LayoutGrid },
];

export default async function CampusHomePage({
  params,
}: {
  params: Promise<{ campus: string }>;
}) {
  const { campus } = await params;
  const supabase = await createClient();

  const { data: campusData } = await supabase
    .from("campuses")
    .select("*, universities(name)")
    .eq("slug", campus)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (!campusData) {
    notFound();
  }

  const { data: featuredProperties } = await supabase
    .from("property_listings")
    .select("*")
    .eq("campus_id", campusData.id)
    .eq("status", "published")
    .not("featured_order", "is", null)
    .order("featured_order", { ascending: true })
    .limit(6);

  const { data: neighbourhoods } = await supabase
    .from("neighbourhoods")
    .select("*")
    .eq("campus_id", campusData.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("name");

  return (
    <div className="flex flex-col pb-16 md:pb-0">

      {/* ── Hero on the brand night surface ───────────────── */}
      <section className="relative overflow-hidden bg-night">
        <div className="absolute inset-0 bg-dots-light opacity-40 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_0%,black,transparent)]" aria-hidden="true" />
        <div className="orb h-[420px] w-[420px] -left-40 -top-40 bg-teal/20" style={{ animation: "floaty 15s ease-in-out infinite" }} aria-hidden="true" />
        <div className="orb h-[440px] w-[440px] -right-44 -top-24 bg-primary/15" style={{ animation: "floaty 17s ease-in-out infinite reverse" }} aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-end opacity-[0.06]" aria-hidden="true">
          <svg width="520" height="520" viewBox="0 0 420 420" fill="none" className="translate-x-24">
            <path d="M 113 297 A 138 138 0 1 1 307 297" stroke="#e8f0fb" strokeWidth="10" strokeLinecap="round" />
            <path d="M 113 297 L 210 190 L 307 297" stroke="#e8f0fb" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="210" cy="190" r="14" fill="var(--logo-orange)" />
          </svg>
        </div>
        <div className="relative container mx-auto px-4 py-16 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-medium text-white/75 backdrop-blur-sm animate-fade-in">
              {campusData.name} · {campusData.universities.name}
            </p>
            <h1 className="heading-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-6xl animate-slide-up">
              Find accommodation near{" "}
              <span className="gradient-text">{campusData.universities.name}</span>
            </h1>
            <p className="mb-8 mt-5 text-lg text-white/70 animate-slide-up stagger-1">
              {featuredProperties?.length ?? 0}+ verified properties — real photos, honest prices.
            </p>

            {/* Search bar — white rounded-2xl with shadow-xl */}
            <form action={`/${campus}/search`} className="animate-slide-up stagger-2">
              <div className="mx-auto flex max-w-xl items-center gap-2 rounded-2xl border border-white/20 bg-white p-2 shadow-2xl">
                <div className="flex flex-1 items-center gap-3 px-3">
                  <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <input
                    name="q"
                    placeholder="Search by name, area, or amenity..."
                    className="flex-1 bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                </div>
                <Button type="submit" className="h-10 shrink-0 rounded-xl px-5 font-semibold shadow-lg shadow-primary/25">
                  Search
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── Category Pills ────────────────────────────────── */}
      <section className="py-5 border-b border-border bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
            {propertyTypeConfig.map((type) => (
              <Link
                key={type.value}
                href={`/${campus}/search?type=${type.value}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground whitespace-nowrap hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all shrink-0"
              >
                <type.icon className="h-4 w-4 text-muted-foreground" />
                {type.label}
              </Link>
            ))}
            <Link
              href={`/${campus}/search`}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2.5 text-sm font-medium text-primary whitespace-nowrap shrink-0"
            >
              View all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured Properties ───────────────────────────── */}
      <section className="section-py bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <span className="eyebrow">Featured</span>
              <h2 className="heading-display mt-4 text-2xl font-extrabold text-foreground lg:text-3xl">
                Top-rated properties
              </h2>
            </div>
            <Link href={`/${campus}/search`}>
              <Button variant="ghost" size="sm" className="gap-1.5 font-medium text-primary hover:text-primary">
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {featuredProperties && featuredProperties.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProperties.map((property) => (
                <Link
                  key={property.id}
                  href={`/${campus}/property/${property.slug}`}
                  className="group"
                >
                  {/* Image */}
                  <div className="property-card-img relative mb-3 overflow-hidden rounded-3xl ring-1 ring-border transition-shadow duration-300 group-hover:shadow-premium">
                    {property.media_url ? (
                      <Image
                        src={property.media_url}
                        alt={property.title ?? "Property"}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-gradient-to-br from-muted to-muted/40">
                        <Building2 className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                    {/* Decorative heart — favourites not yet wired up.
                        Must NOT carry an onClick: this renders inside a
                        Server Component, where event handlers throw
                        "Event handlers cannot be passed to Client Component
                        props" at render time. */}
                    <span
                      aria-hidden="true"
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/85 shadow-sm backdrop-blur-sm"
                    >
                      <Heart className="h-4 w-4 text-foreground/80" />
                    </span>

                    {/* Verified badge */}
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-night/85 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                      <CheckCircle2 className="h-3 w-3 text-teal" />
                      Verified
                    </span>

                    {/* Price overlay */}
                    <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-[13px] font-extrabold text-foreground shadow-sm backdrop-blur-sm">
                      ₦{property.min_price?.toLocaleString() ?? "N/A"}
                      <span className="text-[10px] font-semibold text-muted-foreground"> /mo</span>
                    </span>
                  </div>

                  {/* Info */}
                  <div className="space-y-1 px-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-primary">
                        {property.title}
                      </h3>
                      <div className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                        <Star className="h-3 w-3 fill-amber text-amber" />
                        <span className="text-xs font-semibold">{property.avg_rating ?? "New"}</span>
                      </div>
                    </div>
                    <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {property.neighbourhood_name ?? property.address}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {property.available_rooms} {property.available_rooms === 1 ? "room" : "rooms"} · {property.property_type?.replace(/_/g, " ")}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(property.amenities ?? []).slice(0, 3).map((amenity) => (
                        <span
                          key={amenity}
                          className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground"
                        >
                          {amenityIcons[amenity] ?? null}
                          {amenity.replace(/_/g, " ")}
                        </span>
                      ))}
                      {(property.amenities ?? []).length > 3 && (
                        <span className="inline-flex items-center rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">
                          +{(property.amenities ?? []).length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 rounded-2xl border border-dashed border-border bg-muted/20">
              <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">No featured properties yet</h3>
              <p className="text-sm text-muted-foreground">Check back soon — new listings are added weekly.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Neighbourhoods ────────────────────────────────── */}
      {neighbourhoods && neighbourhoods.length > 0 && (
        <section className="section-py bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mb-8">
              <span className="eyebrow">Explore areas</span>
              <h2 className="heading-display mt-4 text-2xl font-extrabold text-foreground lg:text-3xl">
                Popular neighbourhoods
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {neighbourhoods.map((area, i) => (
                <Link
                  key={area.id}
                  href={`/${campus}/search?neighbourhood=${area.id}`}
                  className="group relative flex h-[200px] flex-col justify-between overflow-hidden rounded-3xl bg-night p-6 no-underline"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-teal/30 via-night to-night" aria-hidden="true" />
                  <div className="absolute inset-0 bg-dots-light opacity-40" aria-hidden="true" />
                  <div className="orb h-40 w-40 -right-14 -top-14 bg-primary/25 transition-transform duration-500 group-hover:scale-125" aria-hidden="true" />

                  <div className="relative flex items-start justify-between">
                    <Roofline width={22} stroke="#4ecab8" dot="var(--logo-orange)" className="opacity-90" />
                    <span className="font-display text-5xl font-extrabold tracking-tight text-white/10">0{i + 1}</span>
                  </div>

                  <div className="relative">
                    <h3 className="font-display text-lg font-extrabold text-white">{area.name}</h3>
                    {area.description && (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/70">
                        {area.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-1 text-xs font-bold text-white/80 transition-colors group-hover:text-teal">
                      Browse <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
