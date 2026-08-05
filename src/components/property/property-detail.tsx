"use client";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bath,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Fan,
  Flag,
  Flame,
  Footprints,
  Grid2x2,
  Share2,
  Shield,
  Sofa,
  Star,
  WashingMachine,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { Elevation } from "@/components/haloft/elevation";
import { formatNaira, propertyTypeLabel } from "@/components/haloft/format";
import { CONTACT_EMAIL } from "@/lib/constants";
import { walkMinutes } from "@/lib/utils";
import type { PropertyListing, RoomListing } from "@/types/database";

const AMENITY_ICONS: Record<string, typeof Wifi> = {
  wifi: Wifi,
  "24_7_power": Zap,
  generator: Zap,
  security: Shield,
  kitchen: Flame,
  laundry: WashingMachine,
  parking: Car,
  water_heater: Bath,
  ac: Fan,
  gym: Dumbbell,
  en_suite: Bath,
  wardrobe: Sofa,
  reading_table: Sofa,
  balcony: Sofa,
  tv: Sofa,
  mini_fridge: Sofa,
};

const AMENITY_LABELS: Record<string, string> = {
  wifi: "Wi-Fi",
  "24_7_power": "24/7 power",
  generator: "Generator",
  security: "Security",
  kitchen: "Kitchen",
  laundry: "Laundry",
  parking: "Parking",
  water_heater: "Running water",
  ac: "Air conditioning",
  gym: "Gym",
  en_suite: "En-suite bathroom",
  wardrobe: "Wardrobe",
  reading_table: "Reading table",
  balcony: "Balcony",
  tv: "TV",
  mini_fridge: "Mini fridge",
  study_room: "Study room",
  fan: "Fan",
};

function amenityLabel(key: string): string {
  return (
    AMENITY_LABELS[key] ??
    key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
  );
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
  campusName?: string;
  campusLat?: number | null;
  campusLng?: number | null;
}

export function PropertyDetailPage({
  property,
  rooms,
  media,
  reviews,
  campusSlug,
  campusName,
  campusLat,
  campusLng,
}: PropertyDetailPageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const avgRating = property.avg_rating ?? 0;
  const reviewCount = property.review_count ?? 0;
  const title = property.title ?? "Student home";
  const amenities = property.amenities ?? [];
  const rules = property.rules ?? [];
  const description = property.description ?? "";
  const descriptionIsLong = description.length > 420;

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

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const prevImage = useCallback(
    () => setLightboxIndex((i) => (i - 1 + media.length) % media.length),
    [media.length]
  );
  const nextImage = useCallback(
    () => setLightboxIndex((i) => (i + 1) % media.length),
    [media.length]
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", handler);
    };
  }, [lightboxOpen, prevImage, nextImage, closeLightbox]);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* the user dismissed the sheet — fall through to copying */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2200);
    } catch {
      /* clipboard unavailable — nothing sensible left to do */
    }
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="pb-28 md:pb-0">
      {/* ── Breadcrumb ─────────────────────────────────────── */}
      <div className="hairline-b bg-[var(--paper)]">
        <div className="shell flex items-center justify-between gap-4 py-3.5">
          <Link
            href={`/${campusSlug}/search`}
            className="group inline-flex items-center gap-2 text-[13.5px] font-medium text-ink-soft transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">
              Homes near {campusName ?? "campus"}
            </span>
            <span className="sm:hidden">Back</span>
          </Link>

          <button
            type="button"
            onClick={share}
            className="inline-flex h-9 items-center gap-2 rounded-[9px] border border-[var(--line-strong)] px-3 text-[13px] font-medium text-ink transition-colors hover:border-[var(--ink-soft)]"
          >
            <Share2 className="size-3.5" aria-hidden="true" />
            {shareState === "copied" ? "Link copied" : "Share"}
          </button>
        </div>
      </div>

      <div className="shell pt-6 lg:pt-8">
        {/* ── Gallery ──────────────────────────────────────── */}
        {media.length > 0 ? (
          <>
            <div className="hidden grid-cols-4 grid-rows-2 gap-1.5 overflow-hidden rounded-[18px] lg:grid lg:h-[clamp(340px,38vw,460px)]">
              <button
                type="button"
                onClick={() => openLightbox(0)}
                className="relative col-span-2 row-span-2 cursor-zoom-in bg-[var(--paper-warm)]"
              >
                <Image
                  src={media[0].url}
                  alt={media[0].alt_text ?? title}
                  fill
                  priority
                  className="object-cover transition-opacity hover:opacity-95"
                  sizes="50vw"
                />
              </button>
              {media.slice(1, 5).map((m, i) => (
                <button
                  key={m.url}
                  type="button"
                  onClick={() => openLightbox(i + 1)}
                  className="relative cursor-zoom-in bg-[var(--paper-warm)]"
                >
                  <Image
                    src={m.url}
                    alt={m.alt_text ?? `${title} — photo ${i + 2}`}
                    fill
                    className="object-cover transition-opacity hover:opacity-95"
                    sizes="25vw"
                  />
                </button>
              ))}
              {media.length > 5 && (
                <button
                  type="button"
                  onClick={() => openLightbox(0)}
                  className="absolute bottom-4 right-4 inline-flex h-10 items-center gap-2 rounded-[10px] bg-[rgba(255,255,255,0.95)] px-4 text-[13px] font-medium text-ink shadow-ambient transition-colors hover:bg-white"
                >
                  <Grid2x2 className="size-4" aria-hidden="true" />
                  All {media.length} photos
                </button>
              )}
            </div>

            <div className="rail scrollbar-hide -mx-5 flex gap-2 overflow-x-auto px-5 sm:-mx-8 sm:px-8 lg:hidden">
              {media.map((m, i) => (
                <button
                  key={m.url}
                  type="button"
                  onClick={() => openLightbox(i)}
                  className="relative aspect-[4/3] w-[82vw] max-w-[26rem] shrink-0 overflow-hidden rounded-[14px] bg-[var(--paper-warm)]"
                >
                  <Image
                    src={m.url}
                    alt={m.alt_text ?? `${title} — photo ${i + 1}`}
                    fill
                    priority={i === 0}
                    className="object-cover"
                    sizes="82vw"
                  />
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="relative aspect-[16/9] overflow-hidden rounded-[18px] bg-[var(--paper-warm)] lg:aspect-[21/9]">
            <Elevation variant="terrace" />
            <p className="absolute bottom-4 left-4 rounded-full bg-[rgba(255,255,255,0.92)] px-3 py-1.5 text-[12px] font-medium text-muted-foreground">
              Photos are added when the team visits
            </p>
          </div>
        )}

        {/* ── Body ─────────────────────────────────────────── */}
        <div className="mt-10 grid grid-cols-12 gap-y-12 lg:mt-14 lg:gap-x-14">
          <div className="col-span-12 lg:col-span-8">
            <header>
              <div className="flex flex-wrap items-center gap-2">
                {property.is_verified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--teal-tint)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--teal-deep)]">
                    <BadgeCheck className="size-3.5" aria-hidden="true" />
                    Verified by Haloft
                  </span>
                ) : (
                  <span className="rounded-full border border-[var(--line-strong)] px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground">
                    Not yet verified
                  </span>
                )}
                <span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground">
                  {propertyTypeLabel(property.property_type)}
                </span>
                <span className="rounded-full border border-[var(--line)] px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground">
                  {property.available_rooms} of {property.total_rooms} rooms free
                </span>
              </div>

              <h1 className="mt-5 display-2 max-w-[20ch] text-ink">{title}</h1>

              <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[14px] text-muted-foreground">
                <span>{property.address}</span>
                {minutes !== null && (
                  <>
                    <span aria-hidden="true" className="text-[var(--line-strong)]">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <Footprints className="size-4 text-[var(--teal-deep)]" aria-hidden="true" />
                      {minutes} min walk to {campusName ?? "campus"}
                    </span>
                  </>
                )}
                {avgRating > 0 && (
                  <>
                    <span aria-hidden="true" className="text-[var(--line-strong)]">·</span>
                    <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                      <Star
                        className="size-4 fill-current text-[var(--sand-deep)]"
                        aria-hidden="true"
                      />
                      {avgRating}
                      <span className="font-normal text-muted-foreground">
                        ({reviewCount})
                      </span>
                    </span>
                  </>
                )}
              </p>
            </header>

            {/* About */}
            {description && (
              <section className="mt-10 border-t border-[var(--line)] pt-8">
                <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  About this home
                </h2>
                <p
                  className={`mt-4 max-w-[62ch] text-[15px] leading-[1.7] text-ink-soft ${
                    descriptionOpen || !descriptionIsLong ? "" : "line-clamp-4"
                  }`}
                >
                  {description}
                </p>
                {descriptionIsLong && (
                  <button
                    type="button"
                    onClick={() => setDescriptionOpen((v) => !v)}
                    className="mt-3 border-b border-[var(--line-strong)] pb-0.5 text-[13.5px] font-medium text-ink transition-colors hover:border-[var(--teal-deep)]"
                  >
                    {descriptionOpen ? "Show less" : "Read the full description"}
                  </button>
                )}
              </section>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <section className="mt-10 border-t border-[var(--line)] pt-8">
                <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  What this home has
                </h2>
                <ul className="mt-4 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                  {amenities.map((amenity) => {
                    const Icon = AMENITY_ICONS[amenity] ?? Check;
                    return (
                      <li
                        key={amenity}
                        className="flex items-center gap-3 border-b border-[var(--line)] py-3 text-[14px] text-ink-soft"
                      >
                        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        {amenityLabel(amenity)}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {/* House rules */}
            {rules.length > 0 && (
              <section className="mt-10 border-t border-[var(--line)] pt-8">
                <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  House rules
                </h2>
                <ul className="mt-4 space-y-3">
                  {rules.map((rule, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 text-[14px] leading-[1.6] text-ink-soft"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--line-strong)]"
                      />
                      {rule}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Rooms */}
            <section id="rooms" className="mt-10 scroll-mt-28 border-t border-[var(--line)] pt-8">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="display-3 text-ink">Rooms available</h2>
                {rooms.length > 0 && (
                  <span className="text-[13px] text-muted-foreground tabular">
                    {rooms.length} {rooms.length === 1 ? "room" : "rooms"}
                  </span>
                )}
              </div>

              {rooms.length > 0 ? (
                <ul className="mt-6 border-t border-[var(--line)]">
                  {rooms.map((room) => (
                    <li
                      key={room.id}
                      className="flex flex-col gap-4 border-b border-[var(--line)] py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8"
                    >
                      <div className="min-w-0">
                        <p className="text-[16px] font-semibold tracking-[-0.02em] text-ink">
                          {room.name}
                        </p>
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-muted-foreground">
                          <span className="capitalize">
                            {room.room_type?.replace(/_/g, " ")}
                          </span>
                          <span aria-hidden="true" className="text-[var(--line-strong)]">·</span>
                          <span>
                            {room.max_occupancy ?? 1}{" "}
                            {(room.max_occupancy ?? 1) > 1 ? "people" : "person"}
                          </span>
                          {(room.amenities ?? []).length > 0 && (
                            <>
                              <span aria-hidden="true" className="text-[var(--line-strong)]">·</span>
                              <span className="truncate">
                                {(room.amenities ?? [])
                                  .slice(0, 3)
                                  .map(amenityLabel)
                                  .join(" · ")}
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center justify-between gap-5 sm:justify-end">
                        <p className="text-[17px] font-semibold text-ink tabular">
                          {formatNaira(Number(room.price_per_month ?? 0))}
                          <span className="ml-1 text-[12px] font-normal text-muted-foreground">
                            /mo
                          </span>
                        </p>
                        <Link
                          href={`/${campusSlug}/property/${property.slug}/booking?room=${room.id}`}
                          className="group inline-flex h-11 items-center gap-2 rounded-[10px] bg-[var(--navy)] px-5 text-[13.5px] font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
                        >
                          Request this room
                          <ArrowRight className="size-3.5 arrow-nudge" aria-hidden="true" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-6 rounded-[14px] border border-dashed border-[var(--line-strong)] px-6 py-14 text-center">
                  <p className="text-[15px] font-medium text-ink">
                    Every room here is taken right now
                  </p>
                  <p className="mx-auto mt-2 max-w-[44ch] text-[13.5px] text-muted-foreground">
                    Rooms free up between semesters. Browse other homes near
                    campus in the meantime.
                  </p>
                  <Link
                    href={`/${campusSlug}/search`}
                    className="mt-6 inline-flex h-11 items-center rounded-[10px] border border-[var(--line-strong)] px-5 text-[13.5px] font-medium text-ink transition-colors hover:border-[var(--ink-soft)]"
                  >
                    See other homes
                  </Link>
                </div>
              )}
            </section>

            {/* Reviews */}
            <section className="mt-10 border-t border-[var(--line)] pt-8">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h2 className="display-3 text-ink">
                  {avgRating > 0 ? `${avgRating} out of 5` : "No reviews yet"}
                </h2>
                <p className="text-[13.5px] text-muted-foreground">
                  {reviewCount > 0
                    ? `${reviewCount} ${reviewCount === 1 ? "review" : "reviews"} from students who stayed`
                    : "Reviews appear once a student has completed a stay"}
                </p>
              </div>

              {reviews.length > 0 && (
                <ul className="mt-7 grid grid-cols-1 gap-x-10 sm:grid-cols-2">
                  {reviews.map((review) => (
                    <li
                      key={review.id}
                      className="border-t border-[var(--line)] py-6"
                    >
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`size-3.5 ${
                              i < review.overall_rating
                                ? "fill-current text-[var(--sand-deep)]"
                                : "text-[var(--line-strong)]"
                            }`}
                            aria-hidden="true"
                          />
                        ))}
                        <span className="sr-only">
                          {review.overall_rating} out of 5
                        </span>
                      </div>
                      <p className="mt-3 max-w-[46ch] text-[14px] leading-[1.65] text-ink-soft">
                        {review.comment ?? "No comment left."}
                      </p>
                      <p className="mt-3 text-[12.5px] text-muted-foreground">
                        {review.profiles?.full_name ?? "Student"} ·{" "}
                        {new Date(review.created_at).toLocaleDateString("en-NG", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* ── Sticky panel ──────────────────────────────── */}
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <div className="rounded-[16px] border border-[var(--line)] bg-card p-6 shadow-ambient">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Rent from
                </p>
                <p className="mt-1.5 text-[30px] font-semibold tracking-[-0.032em] text-ink tabular">
                  {formatNaira(Number(property.min_price ?? 0))}
                  <span className="ml-1.5 text-[14px] font-normal text-muted-foreground">
                    / month
                  </span>
                </p>

                <dl className="mt-6 space-y-3 border-t border-[var(--line)] pt-5 text-[13.5px]">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Home type</dt>
                    <dd className="font-medium text-ink">
                      {propertyTypeLabel(property.property_type)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Rooms free</dt>
                    <dd className="font-medium text-ink tabular">
                      {property.available_rooms} of {property.total_rooms}
                    </dd>
                  </div>
                  {minutes !== null && (
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-muted-foreground">Walk to campus</dt>
                      <dd className="font-medium text-ink tabular">
                        {minutes} min
                      </dd>
                    </div>
                  )}
                </dl>

                <a
                  href="#rooms"
                  className="group mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--navy)] text-[14.5px] font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
                >
                  {rooms.length > 0 ? "See available rooms" : "See room status"}
                  <ArrowRight className="size-4 arrow-nudge" aria-hidden="true" />
                </a>
                <p className="mt-3 text-center text-[12px] text-muted-foreground">
                  Requesting a room doesn&apos;t charge you. Payment only comes
                  after the booking is confirmed.
                </p>
              </div>

              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
                  `Report a listing: ${title}`
                )}`}
                className="mt-4 inline-flex items-center gap-2 text-[12.5px] text-muted-foreground transition-colors hover:text-ink"
              >
                <Flag className="size-3.5" aria-hidden="true" />
                Something wrong with this listing?
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile action bar ────────────────────────────── */}
      <div className="fixed bottom-16 left-0 right-0 z-30 border-t border-[var(--line)] bg-[rgba(247,247,242,0.96)] backdrop-blur-[10px] md:hidden">
        <div className="shell flex items-center justify-between gap-4 py-3">
          <div>
            <p className="text-[17px] font-semibold text-ink tabular">
              {formatNaira(Number(property.min_price ?? 0))}
              <span className="ml-1 text-[12px] font-normal text-muted-foreground">
                /mo
              </span>
            </p>
            <p className="text-[11.5px] text-muted-foreground">
              {property.available_rooms} of {property.total_rooms} rooms free
            </p>
          </div>
          <a
            href="#rooms"
            className="inline-flex h-12 items-center rounded-[10px] bg-[var(--navy)] px-5 text-[14px] font-medium text-white"
          >
            See rooms
          </a>
        </div>
      </div>

      {/* ── Lightbox ─────────────────────────────────────── */}
      {lightboxOpen && media.length > 0 && (
          <div
            className="fade-in fixed inset-0 z-[100] flex flex-col bg-[rgba(10,15,20,0.97)]"
            role="dialog"
            aria-modal="true"
            aria-label={`${title} photos`}
          >
            <div className="flex items-center justify-between px-5 py-4">
              <p className="text-[13px] text-white/60 tabular">
                {lightboxIndex + 1} / {media.length}
              </p>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeLightbox}
                className="inline-flex size-11 items-center justify-center rounded-[10px] text-white transition-colors hover:bg-white/10"
                aria-label="Close photos"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="relative flex flex-1 items-center justify-center px-4">
              {media.length > 1 && (
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-3 z-10 inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
              )}

              <div className="relative aspect-[4/3] w-full max-w-4xl">
                <Image
                  src={media[lightboxIndex]?.url ?? ""}
                  alt={media[lightboxIndex]?.alt_text ?? `${title} photo`}
                  fill
                  className="object-contain"
                  sizes="90vw"
                />
              </div>

              {media.length > 1 && (
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-3 z-10 inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                  aria-label="Next photo"
                >
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
              )}
            </div>

            {media.length > 1 && (
              <div className="scrollbar-hide flex gap-2 overflow-x-auto px-5 py-4">
                {media.map((m, i) => (
                  <button
                    key={m.url}
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    className={`relative size-16 shrink-0 overflow-hidden rounded-[8px] transition-opacity ${
                      i === lightboxIndex
                        ? "ring-2 ring-white"
                        : "opacity-55 hover:opacity-100"
                    }`}
                    aria-label={`Photo ${i + 1}`}
                  >
                    <Image src={m.url} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
    </div>
  );
}
