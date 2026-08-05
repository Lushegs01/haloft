import { notFound } from "next/navigation";
import { PropertyDetailPage } from "@/components/property/property-detail";
import {
  getActiveCampuses,
  getCampusBySlug,
  getPropertyBySlug,
  getPropertyMedia,
  getPropertyMeta,
  getPropertyReviews,
  getPropertyRooms,
  getPublishedPropertySlugs,
} from "@/lib/data/campus";

/**
 * Prerender the published catalogue. Listings are read far more often
 * than they change, so serving them from the cache rather than rendering
 * per visitor is what keeps a launch week cheap.
 */
export async function generateStaticParams() {
  try {
    const campuses = await getActiveCampuses();
    const params = await Promise.all(
      campuses.map(async (campus) => {
        const slugs = await getPublishedPropertySlugs(campus.id);
        return slugs.map((slug) => ({ campus: campus.slug, slug }));
      })
    );
    return params.flat();
  } catch {
    // No database during the build — render on demand instead of failing.
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ campus: string; slug: string }>;
}) {
  const { campus, slug } = await params;
  const campusData = await getCampusBySlug(campus);
  if (!campusData) return { title: "Not Found" };

  const property = await getPropertyMeta(campusData.id, slug);

  return {
    title: property?.meta_title ?? property?.title ?? "Property",
    description: property?.meta_description ?? property?.description ?? "",
  };
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ campus: string; slug: string }>;
}) {
  const { campus, slug } = await params;

  const campusData = await getCampusBySlug(campus);
  if (!campusData) {
    notFound();
  }

  const property = await getPropertyBySlug(campusData.id, slug);
  if (!property || !property.id) {
    notFound();
  }

  // Rooms, photos and reviews all hang off the property and none depends
  // on the others, so they go out together.
  const [rooms, media, reviews] = await Promise.all([
    getPropertyRooms(property.id),
    getPropertyMedia("property", property.id),
    getPropertyReviews(property.id),
  ]);

  return (
    <PropertyDetailPage
      property={property}
      rooms={rooms}
      media={media}
      reviews={reviews}
      campusSlug={campusData.slug}
      campusName={campusData.name}
      campusLat={campusData.latitude}
      campusLng={campusData.longitude}
    />
  );
}
