import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import Image from "next/image";

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-4 w-4" />,
  "24_7_power": <Zap className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  kitchen: <Flame className="h-4 w-4" />,
  laundry: <WashingMachine className="h-4 w-4" />,
  parking: <Car className="h-4 w-4" />,
  study_room: <Building2 className="h-4 w-4" />,
  water_heater: <Droplets className="h-4 w-4" />,
  ac: <Fan className="h-4 w-4" />,
  gym: <Dumbbell className="h-4 w-4" />,
};

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

  const propertyTypes = [
    { value: "hostel", label: "Hostel", icon: Building2 },
    { value: "apartment", label: "Apartment", icon: Building2 },
    { value: "shared_house", label: "Shared House", icon: Building2 },
    { value: "single_room", label: "Single Room", icon: Building2 },
    { value: "self_contained", label: "Self Contained", icon: Building2 },
    { value: "studio", label: "Studio", icon: Building2 },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-cream via-background to-muted py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4">
              Student accommodation near{" "}
              <span className="text-primary">{campusData.universities.name}</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Browse {featuredProperties?.length ?? 0}+ verified properties in {campusData.name}
            </p>

            <form action={`/${campus}/search`} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder="Search by name, area, or amenity..."
                  className="pl-10 h-12"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Property Types */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {propertyTypes.map((type) => (
              <Link
                key={type.value}
                href={`/${campus}/search?type=${type.value}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground whitespace-nowrap hover:border-primary/50 hover:bg-primary/5 transition-colors"
              >
                <type.icon className="h-4 w-4 text-muted-foreground" />
                {type.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Featured Properties</h2>
            <Link href={`/${campus}/search`}>
              <Button variant="ghost" size="sm" className="gap-1">
                View all
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {featuredProperties && featuredProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <Link
                  key={property.id}
                  href={`/${campus}/property/${property.slug}`}
                  className="group rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-lg hover:border-primary/20"
                >
                  <div className="relative aspect-[4/3] bg-muted">
                    {property.media_url ? (
                      <Image
                        src={property.media_url}
                        alt={property.title ?? "Property"}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-muted">
                        <Building2 className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center rounded-full bg-primary/90 px-2.5 py-1 text-xs font-medium text-primary-foreground">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        {property.avg_rating ?? "New"}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {property.title}
                        </h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {property.neighbourhood_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          ₦{property.min_price?.toLocaleString() ?? "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">/month</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(property.amenities ?? [])
                        .slice(0, 4)
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
          ) : (
            <div className="text-center py-16 rounded-xl border border-dashed border-border bg-muted/30">
              <Building2 className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No featured properties yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Neighbourhoods */}
      {neighbourhoods && neighbourhoods.length > 0 && (
        <section className="py-12 lg:py-16 bg-muted/50">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight mb-8">Popular Areas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {neighbourhoods.map((area) => (
                <Link
                  key={area.id}
                  href={`/${campus}/search?neighbourhood=${area.id}`}
                  className="group relative rounded-xl border border-border bg-card p-6 transition-all hover:shadow-md hover:border-primary/20"
                >
                  <MapPin className="h-5 w-5 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {area.name}
                  </h3>
                  {area.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {area.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
