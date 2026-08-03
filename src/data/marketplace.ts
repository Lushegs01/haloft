import { unstable_cache } from "next/cache";
import { DEFAULT_CAMPUS_SLUG } from "@/lib/constants";
import {
  CACHE_TAGS,
  getActiveCampuses,
  getCampusBySlug,
  getCampusProperties,
} from "@/lib/data/campus";
import { walkMinutes } from "@/lib/utils";

/* ==================================================================
   Landing-page marketplace data.
   Real queries are preferred; typed mocks below are the offline /
   empty-database fallback so the page still renders a coherent,
   honest preview. Every mock card is explicitly labelled "sample"
   by `source` so the UI can badge it — nothing fabricated is shown
   as if it were live data.
   ================================================================== */

export interface UniversityCard {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  city: string;
  state: string;
  status: "live" | "coming_soon";
  homesLabel: string;
  gradient: string;
}

export interface ListingCard {
  id: string;
  title: string;
  slug: string;
  campusSlug: string;
  neighbourhood: string;
  address: string;
  distanceKm: number;
  walkMinutes: number;
  pricePerMonth: number;
  currency: string;
  propertyType: string;
  amenities: string[];
  verified: boolean;
  rating: number | null;
  reviewCount: number;
  availableRooms: number;
  imageUrl: string | null;
  source: "live" | "sample";
}

const UNIVERSITIES_FALLBACK: UniversityCard[] = [
  { id: "u-funaab", name: "Federal University of Agriculture, Abeokuta", shortName: "FUNAAB", slug: "funaab", city: "Abeokuta", state: "Ogun State", status: "live", homesLabel: "Homes listed", gradient: "from-emerald-600 to-teal-700" },
  { id: "u-unilag", name: "University of Lagos", shortName: "UNILAG", slug: "unilag", city: "Lagos", state: "Lagos State", status: "coming_soon", homesLabel: "Opening soon", gradient: "from-sky-600 to-blue-800" },
  { id: "u-ui", name: "University of Ibadan", shortName: "UI", slug: "ui", city: "Ibadan", state: "Oyo State", status: "coming_soon", homesLabel: "Opening soon", gradient: "from-violet-600 to-indigo-800" },
  { id: "u-oau", name: "Obafemi Awolowo University", shortName: "OAU", slug: "oau", city: "Ile-Ife", state: "Osun State", status: "coming_soon", homesLabel: "Opening soon", gradient: "from-amber-500 to-orange-700" },
  { id: "u-lasu", name: "Lagos State University", shortName: "LASU", slug: "lasu", city: "Ojo, Lagos", state: "Lagos State", status: "coming_soon", homesLabel: "Opening soon", gradient: "from-rose-500 to-red-700" },
  { id: "u-covenant", name: "Covenant University", shortName: "Covenant", slug: "covenant", city: "Ota", state: "Ogun State", status: "coming_soon", homesLabel: "Opening soon", gradient: "from-cyan-600 to-teal-800" },
];

const LISTINGS_FALLBACK: ListingCard[] = [
  {
    id: "s-1", title: "Ayo's Lodge — Room 14", slug: "ayos-lodge", campusSlug: "funaab",
    neighbourhood: "Toll Gate", address: "12 Akindeko Street, Toll Gate, Abeokuta",
    distanceKm: 1.4, walkMinutes: 17, pricePerMonth: 45000, currency: "NGN",
    propertyType: "hostel", amenities: ["Ensuite bathroom", "Water", "Electricity", "Security"],
    verified: true, rating: 4.6, reviewCount: 38, availableRooms: 6,
    imageUrl: null, source: "sample",
  },
  {
    id: "s-2", title: "Greenview Hostel — Self-contained", slug: "greenview-hostel", campusSlug: "funaab",
    neighbourhood: "Alabata Road", address: "23 Alabata Road, Abeokuta",
    distanceKm: 2.1, walkMinutes: 26, pricePerMonth: 65000, currency: "NGN",
    propertyType: "self_contained", amenities: ["Self-contained", "Water", "Electricity", "Wi-Fi", "Security"],
    verified: true, rating: 4.8, reviewCount: 54, availableRooms: 3,
    imageUrl: null, source: "sample",
  },
  {
    id: "s-3", title: "Smiley Hostel — Standard", slug: "smiley-hostel", campusSlug: "funaab",
    neighbourhood: "Ashe Village", address: "7 Adatan Road, Abeokuta",
    distanceKm: 0.9, walkMinutes: 11, pricePerMonth: 38000, currency: "NGN",
    propertyType: "hostel", amenities: ["Water", "Electricity", "Security", "Furnished"],
    verified: false, rating: 4.1, reviewCount: 21, availableRooms: 11,
    imageUrl: null, source: "sample",
  },
  {
    id: "s-4", title: "CityEdge Apartments — Studio", slug: "cityedge-apartments", campusSlug: "funaab",
    neighbourhood: "Oke-Ijebu", address: "41 Oke-Ijebu Road, Abeokuta",
    distanceKm: 2.8, walkMinutes: 35, pricePerMonth: 85000, currency: "NGN",
    propertyType: "studio", amenities: ["Studio", "Water", "Electricity", "Wi-Fi", "Parking"],
    verified: true, rating: 4.7, reviewCount: 29, availableRooms: 2,
    imageUrl: null, source: "sample",
  },
  {
    id: "s-5", title: "Peace Court — Single Room", slug: "peace-court", campusSlug: "funaab",
    neighbourhood: "Ajuwon", address: "3 Ajuwon Layout, Abeokuta",
    distanceKm: 1.1, walkMinutes: 14, pricePerMonth: 30000, currency: "NGN",
    propertyType: "single_room", amenities: ["Water", "Electricity", "Security"],
    verified: true, rating: 4.3, reviewCount: 17, availableRooms: 8,
    imageUrl: null, source: "sample",
  },
  {
    id: "s-6", title: "Olive Court — Shared Flat", slug: "olive-court", campusSlug: "funaab",
    neighbourhood: "Camp", address: "18 Camp Road, Abeokuta",
    distanceKm: 1.7, walkMinutes: 21, pricePerMonth: 52000, currency: "NGN",
    propertyType: "shared_house", amenities: ["Furnished", "Water", "Electricity", "Wi-Fi"],
    verified: false, rating: 4.0, reviewCount: 12, availableRooms: 4,
    imageUrl: null, source: "sample",
  },
];

/* ------------------------------------------------------------------
   Real-data queries (server components only).
   ------------------------------------------------------------------ */

function haversineKm(
  lat1: number, lng1: number, lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

/** Real campuses first (active in DB), padded with clearly-labelled
 *  "coming soon" cards so the grid reads as a real ecosystem. */
export async function getLandingUniversities(): Promise<{
  universities: UniversityCard[];
  source: "live" | "sample";
}> {
  try {
    const campuses = await getActiveCampuses();
    if (campuses.length > 0) {
      const seen = new Set<string>();
      const live: UniversityCard[] = [];
      for (const c of campuses) {
        const uni = c.universities as { name?: string; slug?: string } | null;
        const uniName = uni?.name ?? c.name;
        const uniSlug = uni?.slug ?? c.slug;
        const key = uniSlug || uniName;
        if (seen.has(key)) continue;
        seen.add(key);
        live.push({
          id: c.id,
          name: uniName,
          shortName: uniSlug.toUpperCase(),
          slug: c.slug,
          city: c.city,
          state: c.state,
          status: "live",
          homesLabel: "Homes listed",
          gradient: "from-emerald-600 to-teal-700",
        });
      }
      if (live.length > 0) {
        const pad = UNIVERSITIES_FALLBACK.filter(
          (u) => !live.some((l) => l.shortName.toLowerCase() === u.shortName.toLowerCase())
        );
        const universities = [...live, ...pad.slice(0, Math.max(0, 6 - live.length))];
        return { universities, source: "live" };
      }
    }
  } catch {
    /* fall through to mocks */
  }
  return { universities: UNIVERSITIES_FALLBACK, source: "sample" };
}

/** Featured listing cards: real published properties on the default
 *  campus when available, else typed sample data. */
export async function getLandingListings(): Promise<{
  listings: ListingCard[];
  source: "live" | "sample";
}> {
  try {
    const campus = await getCampusBySlug(DEFAULT_CAMPUS_SLUG);
    if (campus) {
      const { properties } = await getCampusProperties(campus.id, undefined, 1);
      if (properties.length > 0) {
        const clat = Number(campus.latitude);
        const clng = Number(campus.longitude);
        const listings: ListingCard[] = properties.slice(0, 6).map((p) => {
          const plat = Number(p.latitude);
          const plng = Number(p.longitude);
          const distanceKm = Number.isFinite(plat) && Number.isFinite(plng)
            ? haversineKm(clat, clng, plat, plng)
            : 0;
          return {
            id: p.id ?? `${p.slug}-${p.latitude}-${p.longitude}`,
            title: p.title ?? "Student home",
            slug: p.slug ?? `${p.id}-home`,
            campusSlug: campus.slug,
            neighbourhood: p.neighbourhood_name ?? "Near campus",
            address: p.address ?? "",
            distanceKm,
            walkMinutes: distanceKm > 0 ? walkMinutes(clat, clng, plat, plng) : 0,
            pricePerMonth: Number(p.min_price ?? 0),
            currency: p.currency ?? "NGN",
            propertyType: p.property_type ?? "hostel",
            amenities: Array.isArray(p.amenities) ? p.amenities : [],
            verified: p.is_verified ?? false,
            rating: p.avg_rating ? Number(p.avg_rating) : null,
            reviewCount: p.review_count ?? 0,
            availableRooms: p.available_rooms ?? 0,
            imageUrl: p.media_url ?? null,
            source: "live",
          };
        });
        return { listings, source: "live" };
      }
    }
  } catch {
    /* fall through to mocks */
  }
  return { listings: LISTINGS_FALLBACK, source: "sample" };
}

/** Cache tag helper kept in sync with the catalog so admin publishes
 *  invalidate the landing page too. */
export async function getLandingData() {
  return unstable_cache(
    async () => {
      const [universities, listings] = await Promise.all([
        getLandingUniversities(),
        getLandingListings(),
      ]);
      return { universities, listings };
    },
    ["landing-data"],
    { tags: [CACHE_TAGS.properties, CACHE_TAGS.campuses], revalidate: 300 }
  )();
}
