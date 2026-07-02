"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Building2,
  MapPin,
  Star,
  BedDouble,
  Bath,
  Maximize,
  Wifi,
  Shield,
  Droplets,
  Car,
  WashingMachine,
  Fan,
  Zap,
  Flame,
  Dumbbell,
  ArrowLeft,
  Heart,
  Share2,
  CheckCircle2,
  Calendar,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { PropertyListing, RoomListing } from "@/types/database";

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
  en_suite: <Bath className="h-4 w-4" />,
  wardrobe: <CheckCircle2 className="h-4 w-4" />,
  reading_table: <CheckCircle2 className="h-4 w-4" />,
  balcony: <CheckCircle2 className="h-4 w-4" />,
  tv: <CheckCircle2 className="h-4 w-4" />,
  mini_fridge: <CheckCircle2 className="h-4 w-4" />,
};

function formatAmenityLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface PropertyDetailPageProps {
  property: PropertyListing;
  rooms: RoomListing[];
  media: Array<{ url: string; alt_text: string | null; is_featured: boolean }>;
  reviews: Array<{
    id: string;
    overall_rating: number;
    comment: string | null;
    created_at: string;
    profiles: { full_name: string | null; avatar_url: string | null } | null;
  }>;
  campusSlug: string;
}

export function PropertyDetailPage({
  property,
  rooms,
  media,
  reviews,
  campusSlug,
}: PropertyDetailPageProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const mainImage = media[selectedImage]?.url ?? null;
  const avgRating = property.avg_rating ?? 0;
  const reviewCount = property.review_count ?? 0;

  return (
    <div className="flex flex-col min-h-full">
      {/* Breadcrumb + Actions */}
      <div className="border-b border-border">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/${campusSlug}/search`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to search
            </Link>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFavorite(!isFavorite)}
                className={isFavorite ? "text-rose" : ""}
              >
                <Heart
                  className={`h-5 w-5 ${isFavorite ? "fill-rose" : ""}`}
                />
                <span className="sr-only">Favorite</span>
              </Button>
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
                <span className="sr-only">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-6">
        {/* Image Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={property.title ?? "Property"}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Building2 className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {media.slice(1, 5).map((m, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i + 1)}
                className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted transition-opacity hover:opacity-90"
              >
                <Image
                  src={m.url}
                  alt={m.alt_text ?? "Property image"}
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Property Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
                    {property.title}
                  </h1>
                  <p className="text-muted-foreground flex items-center gap-1 mt-2">
                    <MapPin className="h-4 w-4" />
                    {property.address}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber text-amber" />
                    <span className="font-semibold">{avgRating || "New"}</span>
                    <span className="text-muted-foreground text-sm">
                      ({reviewCount} reviews)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Badge variant="secondary" className="capitalize">
                  {property.property_type?.replace("_", " ")}
                </Badge>
                <Badge variant="outline" className="text-success border-success">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
                <Badge variant="outline">
                  {property.available_rooms} of {property.total_rooms} available
                </Badge>
              </div>
            </div>

            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="about"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
                >
                  About
                </TabsTrigger>
                <TabsTrigger
                  value="rooms"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
                >
                  Rooms ({rooms.length})
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
                >
                  Reviews ({reviewCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="pt-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {property.description ?? "No description available."}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Amenities</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {(property.amenities ?? []).map((amenity) => (
                        <div
                          key={amenity}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="text-primary">
                            {amenityIcons[amenity] ?? (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                          </span>
                          {formatAmenityLabel(amenity)}
                        </div>
                      ))}
                    </div>
                  </div>

                  {(property.rules ?? []).length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">House Rules</h3>
                      <ul className="space-y-2">
                        {(property.rules ?? []).map((rule, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="rooms" className="pt-6">
                {rooms.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {rooms.map((room) => (
                      <div
                        key={room.id}
                        className="rounded-xl border border-border bg-card p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{room.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {room.room_type} · {(room.max_occupancy ?? 1)} person
                              {(room.max_occupancy ?? 1) > 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary">
                              ₦{room.price_per_month?.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              /month
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {(room.amenities ?? [])
                            .slice(0, 4)
                            .map((a) => (
                              <span
                                key={a}
                                className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
                              >
                                {amenityIcons[a] ?? null}
                                {formatAmenityLabel(a)}
                              </span>
                            ))}
                        </div>
                        <Link href={`/${campusSlug}/property/${property.slug}/booking?room=${room.id}`} className="w-full mt-4 block">
                          <Button className="w-full" size="sm">
                            Book This Room
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 rounded-xl border border-dashed border-border bg-muted/30">
                    <BedDouble className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      No rooms available at this time.
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="pt-6">
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-xl border border-border bg-card p-4"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                            {review.profiles?.full_name?.[0] ?? "S"}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {review.profiles?.full_name ?? "Student"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="ml-auto flex gap-1">
                            {Array.from({
                              length: review.overall_rating,
                            }).map((_, i) => (
                              <Star
                                key={i}
                                className="h-3.5 w-3.5 fill-amber text-amber"
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {review.comment ?? "No comment provided."}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 rounded-xl border border-dashed border-border bg-muted/30">
                    <Star className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No reviews yet.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-xl border border-border bg-card p-6">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">Starting from</p>
                <p className="text-2xl font-bold text-primary">
                  ₦{property.min_price?.toLocaleString() ?? "N/A"}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    /month
                  </span>
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Flexible move-in dates</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Verified by Haloft team</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span>Secure booking process</span>
                </div>
              </div>

              <Button className="w-full" size="lg">
                Check Availability
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-3">
                You won&apos;t be charged yet. Availability is confirmed instantly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
