"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth/admin";
import { CACHE_TAGS } from "@/lib/data/campus";
import { z } from "zod";

const roomSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  roomType: z.enum(["single", "double", "triple", "quad", "suite", "shared"]),
  floor: z.coerce.number().int().min(0).max(200).optional(),
  maxOccupancy: z.coerce.number().int().min(1).max(20),
  annualRent: z.coerce.number().min(0).max(1_000_000_000),
  agencyFee: z.coerce.number().min(0).max(1_000_000_000),
  cautionFee: z.coerce.number().min(0).max(1_000_000_000),
  amenities: z.string().optional(),
});

function parseRoom(formData: FormData) {
  const raw = {
    propertyId: formData.get("propertyId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    roomType: formData.get("roomType"),
    floor: formData.get("floor") || undefined,
    maxOccupancy: formData.get("maxOccupancy"),
    annualRent: formData.get("annualRent"),
    agencyFee: formData.get("agencyFee") || 0,
    cautionFee: formData.get("cautionFee") || 0,
    amenities: formData.get("amenities") || undefined,
  };
  return roomSchema.safeParse(raw);
}

function amenitiesArray(value?: string) {
  return value
    ? value.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
}

export async function createRoom(formData: FormData) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);
  if (!user) return { error: "Unauthorized" };

  const parsed = parseRoom(formData);
  if (!parsed.success) {
    return { error: "Invalid room data: " + parsed.error.issues.map((e) => e.message).join(", ") };
  }
  const d = parsed.data;

  const { error } = await supabase.from("rooms").insert({
    property_id: d.propertyId,
    name: d.name,
    description: d.description || null,
    room_type: d.roomType,
    floor: d.floor ?? null,
    max_occupancy: d.maxOccupancy,
    annual_rent: d.annualRent,
    agency_fee: d.agencyFee,
    caution_fee: d.cautionFee,
    amenities: amenitiesArray(d.amenities),
    currency: "NGN",
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/properties/${d.propertyId}`);
  revalidateTag(CACHE_TAGS.properties, "max");
  return { success: true };
}

export async function updateRoom(roomId: string, formData: FormData) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);
  if (!user) return { error: "Unauthorized" };

  if (!z.string().uuid().safeParse(roomId).success) {
    return { error: "Invalid room." };
  }

  const parsed = parseRoom(formData);
  if (!parsed.success) {
    return { error: "Invalid room data: " + parsed.error.issues.map((e) => e.message).join(", ") };
  }
  const d = parsed.data;

  const { error } = await supabase
    .from("rooms")
    .update({
      name: d.name,
      description: d.description || null,
      room_type: d.roomType,
      floor: d.floor ?? null,
      max_occupancy: d.maxOccupancy,
      annual_rent: d.annualRent,
      agency_fee: d.agencyFee,
      caution_fee: d.cautionFee,
      amenities: amenitiesArray(d.amenities),
    })
    .eq("id", roomId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/properties/${d.propertyId}`);
  revalidateTag(CACHE_TAGS.properties, "max");
  return { success: true };
}

export async function toggleRoomAvailability(
  roomId: string,
  propertyId: string,
  makeAvailable: boolean
) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("rooms")
    .update({
      is_available: makeAvailable,
      status: makeAvailable ? "available" : "maintenance",
    })
    .eq("id", roomId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/properties/${propertyId}`);
  revalidateTag(CACHE_TAGS.properties, "max");
  return { success: true };
}

export async function deleteRoom(roomId: string, propertyId: string) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);
  if (!user) return { error: "Unauthorized" };

  const { error } = await supabase
    .from("rooms")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", roomId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/properties/${propertyId}`);
  revalidateTag(CACHE_TAGS.properties, "max");
  return { success: true };
}
