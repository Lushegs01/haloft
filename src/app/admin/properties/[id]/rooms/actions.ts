"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth/admin";
import { CACHE_TAGS } from "@/lib/data/campus";
import { limitBy, TOO_MANY_REQUESTS } from "@/lib/rate-limit";
import { logSecurityEventAsync } from "@/lib/security-log";
import { fail, MESSAGES } from "@/lib/errors";
import { z } from "zod";

const uuid = z.string().uuid();

/**
 * Room mutations take a room id and NOTHING ELSE that identifies a
 * resource.
 *
 * `updateRoom(roomId, propertyId, …)` used to take both, then update
 * `.eq("id", roomId)` while revalidating with the client's `propertyId`.
 * The RLS policy on rooms was the thing actually stopping a room from
 * being edited across a campus boundary, so this was not exploitable —
 * but carrying two identifiers for one resource is how authorization
 * drift starts. The second one is never checked against the first, so
 * the day someone adds a query that trusts it, it is already wrong.
 *
 * So the property is DERIVED from the room, server-side, every time. That
 * is also what gets revalidated, which means a stale cache tag can no
 * longer be requested by passing a different id.
 */
async function propertyForRoom(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roomId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("rooms")
    .select("property_id")
    .eq("id", roomId)
    .is("deleted_at", null)
    .maybeSingle();

  return data?.property_id ?? null;
}

const roomFieldsSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  roomType: z.enum(["single", "double", "triple", "quad", "suite", "shared"]),
  floor: z.coerce.number().int().min(0).max(200).optional(),
  maxOccupancy: z.coerce.number().int().min(1).max(20),
  annualRent: z.coerce.number().min(0).max(1_000_000_000),
  agencyFee: z.coerce.number().min(0).max(1_000_000_000),
  cautionFee: z.coerce.number().min(0).max(1_000_000_000),
  amenities: z.string().max(2000).optional(),
});

const createRoomSchema = roomFieldsSchema.extend({ propertyId: uuid });

function readRoomForm(formData: FormData) {
  return {
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
}

function amenitiesArray(value?: string) {
  return value ? value.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

function roomColumns(d: z.infer<typeof roomFieldsSchema>) {
  return {
    name: d.name,
    description: d.description || null,
    room_type: d.roomType,
    floor: d.floor ?? null,
    max_occupancy: d.maxOccupancy,
    annual_rent: d.annualRent,
    agency_fee: d.agencyFee,
    caution_fee: d.cautionFee,
    amenities: amenitiesArray(d.amenities),
  };
}

function revalidateRoom(propertyId: string) {
  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePath("/admin/rooms");
  revalidateTag(CACHE_TAGS.properties, "max");
}

export async function createRoom(formData: FormData) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);
  if (!user) return { error: MESSAGES.unauthorized };

  const limit = await limitBy("adminMutation", { userId: user.id });
  if (!limit.ok) return { error: TOO_MANY_REQUESTS };

  // Creation is the one case where the property genuinely comes from the
  // client: there is no room yet to derive it from. RLS on rooms scopes
  // it to a campus the caller administers.
  const parsed = createRoomSchema.safeParse({
    ...readRoomForm(formData),
    propertyId: formData.get("propertyId"),
  });

  if (!parsed.success) {
    return { error: `${MESSAGES.invalidInput} (${parsed.error.issues[0]?.path.join(".")})` };
  }

  const { propertyId, ...fields } = parsed.data;

  const { data: created, error } = await supabase
    .from("rooms")
    .insert({
      ...roomColumns(fields),
      property_id: propertyId,
      currency: "NGN",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return fail({
      message: MESSAGES.createFailed,
      cause: error,
      context: "createRoom",
      detail: { propertyId },
    });
  }

  logSecurityEventAsync({
    action: "room.created",
    result: "allowed",
    actorId: user.id,
    resourceType: "room",
    resourceId: created?.id,
    detail: { property_id: propertyId, annual_rent: fields.annualRent },
  });

  revalidateRoom(propertyId);
  return { success: true };
}

export async function updateRoom(roomId: string, formData: FormData) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);
  if (!user) return { error: MESSAGES.unauthorized };

  if (!uuid.safeParse(roomId).success) return { error: MESSAGES.notFound };

  const limit = await limitBy("adminMutation", { userId: user.id });
  if (!limit.ok) return { error: TOO_MANY_REQUESTS };

  const parsed = roomFieldsSchema.safeParse(readRoomForm(formData));
  if (!parsed.success) {
    return { error: `${MESSAGES.invalidInput} (${parsed.error.issues[0]?.path.join(".")})` };
  }

  const propertyId = await propertyForRoom(supabase, roomId);
  if (!propertyId) return { error: MESSAGES.notFound };

  const { error } = await supabase
    .from("rooms")
    .update(roomColumns(parsed.data))
    .eq("id", roomId)
    .is("deleted_at", null);

  if (error) {
    return fail({
      message: MESSAGES.updateFailed,
      cause: error,
      context: "updateRoom",
      detail: { roomId },
    });
  }

  logSecurityEventAsync({
    action: "room.updated",
    result: "allowed",
    actorId: user.id,
    resourceType: "room",
    resourceId: roomId,
    detail: { property_id: propertyId, annual_rent: parsed.data.annualRent },
  });

  revalidateRoom(propertyId);
  return { success: true };
}

/**
 * Taking a room off the market, or putting it back.
 *
 * This decides who can book, so it is logged as a security event (the
 * database also logs it from a trigger — see 018 — which catches the
 * changes that come from booking flows rather than from here).
 */
export async function toggleRoomAvailability(
  roomId: string,
  makeAvailable: boolean
) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);
  if (!user) return { error: MESSAGES.unauthorized };

  if (!uuid.safeParse(roomId).success) return { error: MESSAGES.notFound };

  const limit = await limitBy("adminMutation", { userId: user.id });
  if (!limit.ok) return { error: TOO_MANY_REQUESTS };

  const propertyId = await propertyForRoom(supabase, roomId);
  if (!propertyId) return { error: MESSAGES.notFound };

  const { error } = await supabase
    .from("rooms")
    .update({
      is_available: makeAvailable,
      status: makeAvailable ? "available" : "maintenance",
    })
    .eq("id", roomId)
    .is("deleted_at", null);

  if (error) {
    return fail({
      message: MESSAGES.updateFailed,
      cause: error,
      context: "toggleRoomAvailability",
      detail: { roomId, makeAvailable },
    });
  }

  revalidateRoom(propertyId);
  return { success: true };
}

export async function deleteRoom(roomId: string) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);
  if (!user) return { error: MESSAGES.unauthorized };

  if (!uuid.safeParse(roomId).success) return { error: MESSAGES.notFound };

  const limit = await limitBy("adminMutation", { userId: user.id });
  if (!limit.ok) return { error: TOO_MANY_REQUESTS };

  const propertyId = await propertyForRoom(supabase, roomId);
  if (!propertyId) return { error: MESSAGES.notFound };

  const { error } = await supabase
    .from("rooms")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", roomId)
    .is("deleted_at", null);

  if (error) {
    return fail({
      message: MESSAGES.deleteFailed,
      cause: error,
      context: "deleteRoom",
      detail: { roomId },
    });
  }

  logSecurityEventAsync({
    action: "room.deleted",
    result: "allowed",
    actorId: user.id,
    resourceType: "room",
    resourceId: roomId,
    detail: { property_id: propertyId },
  });

  revalidateRoom(propertyId);
  return { success: true };
}
