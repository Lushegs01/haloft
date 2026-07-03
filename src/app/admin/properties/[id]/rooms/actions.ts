"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth/admin";
import { z } from "zod";

const roomSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  roomType: z.enum(["single", "double", "triple", "quad", "suite", "shared"]),
  floor: z.coerce.number().int().min(0).max(200).optional(),
  maxOccupancy: z.coerce.number().int().min(1).max(20),
  pricePerMonth: z.coerce.number().min(0).max(100_000_000),
  depositMonths: z.coerce.number().int().min(0).max(24),
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
    pricePerMonth: formData.get("pricePerMonth"),
    depositMonths: formData.get("depositMonths"),
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
    price_per_month: d.pricePerMonth,
    deposit_months: d.depositMonths,
    amenities: amenitiesArray(d.amenities),
    currency: "NGN",
    created_by: user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(`/admin/properties/${d.propertyId}`);
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
      price_per_month: d.pricePerMonth,
      deposit_months: d.depositMonths,
      amenities: amenitiesArray(d.amenities),
    })
    .eq("id", roomId);

  if (error) return { error: error.message };

  revalidatePath(`/admin/properties/${d.propertyId}`);
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
  return { success: true };
}
