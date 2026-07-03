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
  X,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const avgRating = property.avg_rating ?? 0;
  const reviewCount = property.review_count ?? 0;

  const openLightbox = (idx: number) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const prevImage = () =>
    setLightboxIndex((i) => (i - 1 + media.length) % media.length);
  const nextImage = () =>
    setLightboxIndex((i) => (i + 1) % media.length);

  return (
    <div className="flex flex-col min-h-full pb-16 md:pb-0">

      {/* ── Breadcrumb + Actions ───────────────────────────── */}
      <div className="border-b border-border bg-background">
        <div className="container mx-auto px-4 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <Link
              href={`/${campusSlug}/search`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted px-3 py-1.5 -ml-3"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to search
            </Link>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium border transition-all hover:bg-muted ${
                  isFavorite
                    ? "text-primary border-primary/30 bg-primary/5"
                    : "text-foreground border-border"
                }`}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-primary text-primary" : ""}`} />
                <span className="hidden sm:inline">{isFavorite ? "Saved" : "Save"}</span>
              </button>
              <button className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium border border-border text-foreground hover:bg-muted transition-all">
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-6">

        {/* ── Gallery ───────────────────────────────────────── */}
        {media.length > 0 ? (
          <div className="relative mb-8">
            {/* Desktop: 1 large + 4 grid */}
            <div className="hidden lg:grid grid-cols-4 grid-rows-2 gap-2.5 h-[480px] rounded-2xl overflow-hidden">
              {/* Main large image */}
              <button
                className="col-span-2 row-span-2 relative bg-muted hover:opacity-95 transition-opacity"
                onClick={() => openLightbox(0)}
              >
                {media[0] && (
                  <Image
                    src={media[0].url}
                    alt={media[0].alt_text ?? property.title ?? "Property"}
                    fill
                    className="object-cover"
                    priority
                    sizes="50vw"
                  />
                )}
              </button>
              {/* 4 smaller images */}
              {media.slice(1, 5).map((m, i) => (
                <button
                  key={i}
                  onClick={() => openLightbox(i + 1)}
                  className="relative bg-muted hover:opacity-95 transition-opacity"
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
              {/* Show all photos button */}
              {media.length > 5 && (
                <button
                  onClick={() => openLightbox(0)}
                  className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl bg-white/90 backdrop-blur-sm border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-white transition-colors shadow-md"
                >
                  <Grid3x3 className="h-4 w-4" />
                  Show all {media.length} photos
                </button>
              )}
            </div>

            {/* Mobile: horizontal scroll */}
            <div className="lg:hidden flex gap-3 overflow-x-auto scrollbar-hide rounded-2xl">
              {media.map((m, i) => (
                <button
                  key={i}
                  onClick={() => openLightbox(i)}
                  className="relative flex-shrink-0 w-72 aspect-[4/3] rounded-xl overflow-hidden bg-muted"
                >
                  <Image
                    src={m.url}
                    alt={m.alt_text ?? "Property image"}
                    fill
                    className="object-cover"
                    sizes="288px"
                  />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-2xl bg-muted h-64 mb-8">
            <Building2 className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}

        {/* ── Main layout ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-10">

            {/* Property header */}
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="rounded-full capitalize font-medium">
                  {property.property_type?.replace("_", " ")}
                </Badge>
                <Badge className="rounded-full bg-success/10 text-success border-success/20 font-medium">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified by Haloft
                </Badge>
                <Badge variant="outline" className="rounded-full font-medium">
                  {property.available_rooms} of {property.total_rooms} rooms available
                </Badge>
              </div>

              <h1
                className="text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground mb-3"
                style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}
              >
                {property.title}
              </h1>

              <div className="flex items-center flex-wrap gap-4">
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  {property.address}
                </p>
                {(avgRating > 0 || reviewCount > 0) && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber text-amber" />
                    <span className="font-semibold text-foreground">{avgRating || "New"}</span>
                    <span className="text-muted-foreground text-sm">
                      ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* About */}
            <div>
              <h2
                className="text-xl font-bold mb-4 text-foreground"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                About this property
              </h2>
              <p className="text-muted-foreground leading-relaxed text-base">
                {property.description ?? "No description available."}
              </p>
            </div>

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Amenities */}
            <div>
              <h2
                className="text-xl font-bold mb-5 text-foreground"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                What this place offers
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(property.amenities ?? []).map((amenity) => (
                  <div
                    key={amenity}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5"
                  >
                    <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      {amenityIcons[amenity] ?? <CheckCircle2 className="h-4 w-4" />}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {formatAmenityLabel(amenity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* House Rules */}
            {(property.rules ?? []).length > 0 && (
              <>
                <div className="h-px bg-border" />
                <div>
                  <h2
                    className="text-xl font-bold mb-4 text-foreground"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    House rules
                  </h2>
                  <ul className="space-y-3">
                    {(property.rules ?? []).map((rule, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Divider */}
            <div className="h-px bg-border" />

            {/* Rooms */}
            <div>
              <h2
                className="text-xl font-bold mb-5 text-foreground"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Available rooms{rooms.length > 0 ? ` (${rooms.length})` : ""}
              </h2>
              {rooms.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4
                            className="font-bold text-foreground"
                            style={{ fontFamily: "var(--font-inter)" }}
                          >
                            {room.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-0.5 capitalize">
                            {room.room_type?.replace("_", " ")} · {room.max_occupancy ?? 1} person
                            {(room.max_occupancy ?? 1) > 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary text-lg">
                            ₦{room.price_per_month?.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">/month</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {(room.amenities ?? []).slice(0, 4).map((a) => (
                          <span
                            key={a}
                            className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground"
                          >
                            {amenityIcons[a] ?? null}
                            {formatAmenityLabel(a)}
                          </span>
                        ))}
                      </div>
                      <Link
                        href={`/${campusSlug}/property/${property.slug}/booking?room=${room.id}`}
                        className="block"
                      >
                        <Button className="w-full rounded-xl font-semibold" size="sm">
                          Book This Room
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 rounded-2xl border border-dashed border-border bg-muted/20">
                  <BedDouble className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No rooms available at this time.</p>
                  <p className="text-sm text-muted-foreground mt-1">Check back soon or contact us for waitlist info.</p>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="h-px bg-border" />
            <div>
              <div className="flex items-center gap-3 mb-6">
                <h2
                  className="text-xl font-bold text-foreground"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  Student reviews
                </h2>
                {reviewCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber text-amber" />
                    <span className="font-bold text-foreground">{avgRating}</span>
                    <span className="text-muted-foreground text-sm">({reviewCount})</span>
                  </div>
                )}
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-5">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{
                            background: `hsl(${(review.profiles?.full_name?.charCodeAt(0) ?? 0) * 7 % 360} 60% 50%)`,
                          }}
                        >
                          {review.profiles?.full_name?.[0]?.toUpperCase() ?? "S"}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-foreground">
                            {review.profiles?.full_name ?? "Student"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString("en-NG", {
                              year: "numeric",
                              month: "long",
                            })}
                          </p>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < review.overall_rating ? "fill-amber text-amber" : "text-muted-foreground/30"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {review.comment ?? "No comment provided."}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-14 rounded-2xl border border-dashed border-border bg-muted/20">
                  <Star className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">No reviews yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Be the first to review after your stay.</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Booking Sidebar ───────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-border bg-card shadow-xl shadow-black/8 p-6">
              {/* Price */}
              <div className="mb-5">
                <p className="text-sm text-muted-foreground">Starting from</p>
                <p
                  className="text-3xl font-extrabold text-foreground mt-1"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  ₦{property.min_price?.toLocaleString() ?? "N/A"}
                  <span className="text-base font-normal text-muted-foreground"> /month</span>
                </p>
              </div>

              {/* Rating inline */}
              {avgRating > 0 && (
                <div className="flex items-center gap-2 mb-5 pb-5 border-b border-border">
                  <Star className="h-4 w-4 fill-amber text-amber" />
                  <span className="font-bold text-sm">{avgRating}</span>
                  <span className="text-muted-foreground text-sm">({reviewCount} reviews)</span>
                </div>
              )}

              {/* Trust points */}
              <div className="space-y-3 mb-6">
                {[
                  { icon: Calendar, label: "Flexible move-in dates" },
                  { icon: User, label: "Verified by Haloft team" },
                  { icon: Shield, label: "Secure booking process" },
                  { icon: CheckCircle2, label: "What you see is what you get" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-foreground" />
                    </div>
                    {label}
                  </div>
                ))}
              </div>

              <Button className="w-full rounded-xl h-12 font-bold text-base shadow-md shadow-primary/20" size="lg">
                Check Availability
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-3 leading-relaxed">
                You won&apos;t be charged yet. Availability confirmed instantly.
              </p>

              {/* Report link */}
              <div className="mt-4 pt-4 border-t border-border text-center">
                <button className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors">
                  Report this listing
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox ──────────────────────────────────────── */}
      {lightboxOpen && media.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={prevImage}
            className="absolute left-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="relative w-full max-w-4xl mx-4 aspect-[4/3]">
            <Image
              src={media[lightboxIndex]?.url ?? ""}
              alt={media[lightboxIndex]?.alt_text ?? "Property image"}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightboxIndex + 1} / {media.length}
          </p>
        </div>
      )}
    </div>
  );
}
