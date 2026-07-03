import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import Image from "next/image";

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

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative hero-gradient overflow-hidden">
        <div className="pointer-events-none absolute -top-20 -right-20 h-[300px] w-[300px] rounded-full bg-primary/8 blur-3xl" />
        <div className="container mx-auto px-4 lg:px-8 py-12 lg:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-primary font-medium text-sm mb-3 animate-fade-in">
              {campusData.name} · {campusData.universities.name}
            </p>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground mb-4 animate-slide-up"
              style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}
            >
              Find accommodation near{" "}
              <span className="gradient-text">{campusData.universities.name}</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8 animate-slide-up stagger-1">
              {featuredProperties?.length ?? 0}+ verified properties — real photos, honest prices.
            </p>

            {/* Search bar */}
            <form action={`/${campus}/search`} className="animate-slide-up stagger-2">
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-card shadow-xl shadow-black/8 p-2 max-w-xl mx-auto">
                <div className="flex-1 flex items-center gap-3 px-3">
                  <Search className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                  <input
                    name="q"
                    placeholder="Search by name, area, or amenity..."
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none py-2"
                  />
                </div>
                <Button type="submit" className="rounded-xl h-10 px-5 font-semibold shrink-0">
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
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-1">
                Featured
              </p>
              <h2
                className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground"
                style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}
              >
                Top-rated properties
              </h2>
            </div>
            <Link href={`/${campus}/search`}>
              <Button variant="ghost" size="sm" className="gap-1.5 text-primary hover:text-primary font-medium">
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {featuredProperties && featuredProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredProperties.map((property) => (
                <Link
                  key={property.id}
                  href={`/${campus}/property/${property.slug}`}
                  className="group rounded-2xl border border-border bg-card overflow-hidden transition-all hover:shadow-xl hover:shadow-black/8 hover:-translate-y-1 card-lift"
                >
                  {/* Image */}
                  <div className="relative aspect-[5/4] bg-muted overflow-hidden">
                    {property.media_url ? (
                      <Image
                        src={property.media_url}
                        alt={property.title ?? "Property"}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-muted">
                        <Building2 className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Verified badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white">
                        <Star className="h-3 w-3 fill-amber text-amber" />
                        {property.avg_rating ?? "New"}
                      </span>
                    </div>

                    {/* Price overlay */}
                    <div className="absolute bottom-3 right-3">
                      <div className="rounded-xl bg-black/60 backdrop-blur-sm px-3 py-1.5">
                        <p className="text-white font-bold text-sm">₦{property.min_price?.toLocaleString() ?? "N/A"}</p>
                        <p className="text-white/70 text-[10px] text-right">/month</p>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3
                      className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1 leading-snug"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {property.title}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {property.neighbourhood_name}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
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
              <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-1">
                Explore areas
              </p>
              <h2
                className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground"
                style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}
              >
                Popular neighbourhoods
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {neighbourhoods.map((area) => (
                <Link
                  key={area.id}
                  href={`/${campus}/search?neighbourhood=${area.id}`}
                  className="group relative rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <h3
                    className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {area.name}
                  </h3>
                  {area.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                      {area.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium">
                    Browse <ArrowRight className="h-3 w-3" />
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
