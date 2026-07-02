"use client";

import Script from "next/script";
import type { PropertyListing } from "@/types/database";

interface JsonLdProps {
  property: PropertyListing;
  campusSlug: string;
}

export function PropertyJsonLd({ property, campusSlug }: JsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingReservation",
    name: property.title,
    description: property.description ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
      addressLocality: "Abeokuta",
      addressRegion: "Ogun",
      addressCountry: "NG",
    },
    url: `https://haloft.com/${campusSlug}/property/${property.slug}`,
    image: property.media_url ? [property.media_url] : undefined,
    offers: {
      "@type": "Offer",
      price: property.min_price?.toString(),
      priceCurrency: property.currency,
      availability: property.available_rooms && property.available_rooms > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    aggregateRating: property.avg_rating
      ? {
          "@type": "AggregateRating",
          ratingValue: property.avg_rating.toString(),
          reviewCount: property.review_count?.toString() ?? "0",
        }
      : undefined,
  };

  return (
    <Script
      id="property-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
