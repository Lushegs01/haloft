"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const propertySchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  address: z.string().min(5),
  campusId: z.string().uuid(),
  neighbourhoodId: z.string().uuid(),
  landlordId: z.string().uuid().optional(),
  propertyType: z.enum(["hostel", "apartment", "shared_house", "single_room", "self_contained", "studio"]),
  status: z.enum(["draft", "published", "unpublished", "archived"]),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  amenities: z.string().optional(),
  rules: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

async function getAdminUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return null;
  }

  return user;
}

export async function createProperty(formData: FormData) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) {
    return { error: "Unauthorized" };
  }

  const raw = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    address: formData.get("address") as string,
    campusId: formData.get("campusId") as string,
    neighbourhoodId: formData.get("neighbourhoodId") as string,
    landlordId: formData.get("landlordId") as string,
    propertyType: formData.get("propertyType") as string,
    status: formData.get("status") as string,
    latitude: formData.get("latitude") as string,
    longitude: formData.get("longitude") as string,
    amenities: formData.get("amenities") as string,
    rules: formData.get("rules") as string,
    metaTitle: formData.get("metaTitle") as string,
    metaDescription: formData.get("metaDescription") as string,
  };

  const parsed = propertySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid data: " + parsed.error.issues.map(e => e.message).join(", ") };
  }

  const data = parsed.data;
  const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36);

  const { error } = await supabase.from("properties").insert({
    title: data.title,
    slug,
    description: data.description || null,
    address: data.address,
    campus_id: data.campusId,
    neighbourhood_id: data.neighbourhoodId,
    landlord_id: data.landlordId || null,
    property_type: data.propertyType,
    status: data.status,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    amenities: data.amenities ? data.amenities.split(",").map(s => s.trim()) : [],
    rules: data.rules ? data.rules.split("\n").map(s => s.trim()).filter(Boolean) : null,
    meta_title: data.metaTitle || null,
    meta_description: data.metaDescription || null,
    currency: "NGN",
    created_by: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/properties");
  redirect("/admin/properties");
}

export async function updateProperty(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) {
    return { error: "Unauthorized" };
  }

  const raw = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    address: formData.get("address") as string,
    campusId: formData.get("campusId") as string,
    neighbourhoodId: formData.get("neighbourhoodId") as string,
    landlordId: formData.get("landlordId") as string,
    propertyType: formData.get("propertyType") as string,
    status: formData.get("status") as string,
    latitude: formData.get("latitude") as string,
    longitude: formData.get("longitude") as string,
    amenities: formData.get("amenities") as string,
    rules: formData.get("rules") as string,
    metaTitle: formData.get("metaTitle") as string,
    metaDescription: formData.get("metaDescription") as string,
  };

  const parsed = propertySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: "Invalid data: " + parsed.error.issues.map(e => e.message).join(", ") };
  }

  const data = parsed.data;

  const { error } = await supabase
    .from("properties")
    .update({
      title: data.title,
      description: data.description || null,
      address: data.address,
      campus_id: data.campusId,
      neighbourhood_id: data.neighbourhoodId,
      landlord_id: data.landlordId || null,
      property_type: data.propertyType,
      status: data.status,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      amenities: data.amenities ? data.amenities.split(",").map(s => s.trim()) : [],
      rules: data.rules ? data.rules.split("\n").map(s => s.trim()).filter(Boolean) : null,
      meta_title: data.metaTitle || null,
      meta_description: data.metaDescription || null,
    })
    .eq("id", propertyId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/properties");
  revalidatePath("/admin/properties/" + propertyId);
  return { success: true };
}

export async function deleteProperty(propertyId: string) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("properties")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", propertyId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/properties");
  return { success: true };
}

export async function duplicateProperty(propertyId: string) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", propertyId)
    .single();

  if (!property) {
    return { error: "Property not found" };
  }

  const newSlug = property.slug + "-copy-" + Date.now().toString(36);
  const newTitle = property.title + " (Copy)";

  const { error } = await supabase.from("properties").insert({
    ...property,
    id: undefined,
    slug: newSlug,
    title: newTitle,
    status: "draft" as const,
    total_rooms: 0,
    available_rooms: 0,
    created_at: undefined,
    updated_at: undefined,
    deleted_at: null,
    created_by: user.id,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/properties");
  return { success: true };
}

export async function bulkUpdateStatus(propertyIds: string[], status: "draft" | "published" | "unpublished" | "archived") {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("properties")
    .update({ status })
    .in("id", propertyIds);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/properties");
  return { success: true };
}
