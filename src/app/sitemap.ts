import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://haloft.com";
  const supabase = await createClient();

  const { data: campuses } = await supabase
    .from("campuses")
    .select("slug, updated_at")
    .eq("is_active", true)
    .is("deleted_at", null);

  const { data: properties } = await supabase
    .from("properties")
    .select("slug, campus_id, campuses(slug), updated_at")
    .eq("status", "published")
    .is("deleted_at", null);

  const routes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
  ];

  (campuses ?? []).forEach((campus) => {
    routes.push({
      url: `${baseUrl}/${campus.slug}`,
      lastModified: campus.updated_at ? new Date(campus.updated_at) : new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    });
    routes.push({
      url: `${baseUrl}/${campus.slug}/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    });
  });

  (properties ?? []).forEach((property) => {
    const campusSlug = (property.campuses as { slug: string } | null)?.slug ?? "campus";
    routes.push({
      url: `${baseUrl}/${campusSlug}/property/${property.slug}`,
      lastModified: property.updated_at ? new Date(property.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  });

  return routes;
}
