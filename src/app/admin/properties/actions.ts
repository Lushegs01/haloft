"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth/admin";
import { CACHE_TAGS } from "@/lib/data/campus";
import { limitBy, TOO_MANY_REQUESTS } from "@/lib/rate-limit";
import { logSecurityEventAsync } from "@/lib/security-log";
import { fail, MESSAGES } from "@/lib/errors";
import { z } from "zod";

/**
 * Every mutation in this file follows the same four steps, in order:
 *
 *     authenticate → authorize → validate → mutate
 *
 * RLS is the backstop, not the gate. It was the only check on several of
 * these, which works right up until a policy is edited by someone who
 * cannot see which action depended on it — and leaves nothing in the
 * trail about who tried what when it refuses.
 */

const uuid = z.string().uuid();

/**
 * The ceiling on a bulk operation.
 *
 * Without one, `bulkUpdateStatus(ids, status)` accepted an array of any
 * length: ten thousand ids is a ten-thousand-element IN clause and a
 * table-sized write, from one request, by an account that is allowed to
 * make requests. RLS stops the wrong rows changing; it does not stop the
 * database being asked to do an hour of work.
 */
const MAX_BULK_IDS = 100;

const bulkIdsSchema = z
  .array(uuid)
  .min(1, "Select at least one property.")
  .max(MAX_BULK_IDS, `Select no more than ${MAX_BULK_IDS} properties at a time.`);

const propertySchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(10_000).optional(),
  address: z.string().min(5).max(500),
  campusId: uuid,
  neighbourhoodId: uuid,
  landlordId: uuid.optional(),
  propertyType: z.enum(["hostel", "apartment", "shared_house", "single_room", "self_contained", "studio"]),
  lettingMode: z.enum(["whole", "rooms"]),
  status: z.enum(["draft", "published", "unpublished", "archived"]),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  amenities: z.string().max(2000).optional(),
  rules: z.string().max(5000).optional(),
  metaTitle: z.string().max(200).optional(),
  metaDescription: z.string().max(500).optional(),
});

/** Sentinels the publish guard and verification machine raise (016). */
const propertySentinels: Record<string, string> = {
  PROPERTY_NOT_VERIFIED:
    "This property has to be verified before it can be published.",
  LANDLORD_NOT_APPROVED:
    "The landlord for this property has not been approved yet.",
  INVALID_VERIFICATION_TRANSITION: "That is not a valid next step for this property.",
  SUPER_ADMIN_ONLY: "Only a super admin can sign off a verification.",
  ADMIN_ONLY: MESSAGES.unauthorized,
  PROPERTY_NOT_FOUND: MESSAGES.notFound,
};

function readPropertyForm(formData: FormData) {
  return {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    address: formData.get("address") as string,
    campusId: formData.get("campusId") as string,
    neighbourhoodId: formData.get("neighbourhoodId") as string,
    landlordId: (formData.get("landlordId") as string) || undefined,
    propertyType: formData.get("propertyType") as string,
    lettingMode: (formData.get("lettingMode") as string) || "rooms",
    status: formData.get("status") as string,
    latitude: (formData.get("latitude") as string) || undefined,
    longitude: (formData.get("longitude") as string) || undefined,
    amenities: (formData.get("amenities") as string) || undefined,
    rules: (formData.get("rules") as string) || undefined,
    metaTitle: (formData.get("metaTitle") as string) || undefined,
    metaDescription: (formData.get("metaDescription") as string) || undefined,
  };
}

function propertyColumns(data: z.infer<typeof propertySchema>) {
  return {
    title: data.title,
    description: data.description || null,
    address: data.address,
    campus_id: data.campusId,
    neighbourhood_id: data.neighbourhoodId,
    landlord_id: data.landlordId || null,
    property_type: data.propertyType,
    letting_mode: data.lettingMode,
    status: data.status,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    amenities: data.amenities ? data.amenities.split(",").map((s) => s.trim()).filter(Boolean) : [],
    rules: data.rules ? data.rules.split("\n").map((s) => s.trim()).filter(Boolean) : null,
    meta_title: data.metaTitle || null,
    meta_description: data.metaDescription || null,
  };
}

export async function createProperty(formData: FormData) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) {
    logSecurityEventAsync({
      action: "property.created",
      result: "denied",
      detail: { reason: "not an admin" },
    });
    return { error: MESSAGES.unauthorized };
  }

  const limit = await limitBy("adminMutation", { userId: user.id });
  if (!limit.ok) return { error: TOO_MANY_REQUESTS };

  const parsed = propertySchema.safeParse(readPropertyForm(formData));
  if (!parsed.success) {
    return { error: `${MESSAGES.invalidInput} (${parsed.error.issues[0]?.path.join(".")})` };
  }

  const data = parsed.data;
  const slug =
    data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
    "-" +
    Date.now().toString(36);

  const { data: created, error } = await supabase
    .from("properties")
    .insert({
      ...propertyColumns(data),
      slug,
      currency: "NGN",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    const known = propertySentinels[error.message];
    if (known) return { error: known };
    return fail({ message: MESSAGES.createFailed, cause: error, context: "createProperty" });
  }

  logSecurityEventAsync({
    action: "property.created",
    result: "allowed",
    actorId: user.id,
    resourceType: "property",
    resourceId: created?.id,
    detail: { campus_id: data.campusId, status: data.status },
  });

  revalidatePath("/admin/properties");
  revalidateTag(CACHE_TAGS.properties, "max");
  redirect("/admin/properties");
}

export async function updateProperty(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) return { error: MESSAGES.unauthorized };

  // Validate the id before it reaches the query. PostgREST would reject a
  // malformed uuid too, but only after a round trip, and its rejection is
  // a database error message rather than something a person can act on.
  if (!uuid.safeParse(propertyId).success) {
    return { error: MESSAGES.notFound };
  }

  const limit = await limitBy("adminMutation", { userId: user.id });
  if (!limit.ok) return { error: TOO_MANY_REQUESTS };

  const parsed = propertySchema.safeParse(readPropertyForm(formData));
  if (!parsed.success) {
    return { error: `${MESSAGES.invalidInput} (${parsed.error.issues[0]?.path.join(".")})` };
  }

  const { error } = await supabase
    .from("properties")
    .update(propertyColumns(parsed.data))
    .eq("id", propertyId)
    .is("deleted_at", null);

  if (error) {
    const known = propertySentinels[error.message];
    if (known) {
      logSecurityEventAsync({
        action: "property.updated",
        result: "denied",
        actorId: user.id,
        resourceType: "property",
        resourceId: propertyId,
        detail: { reason: error.message },
      });
      return { error: known };
    }
    return fail({
      message: MESSAGES.updateFailed,
      cause: error,
      context: "updateProperty",
      detail: { propertyId },
    });
  }

  logSecurityEventAsync({
    action: "property.updated",
    result: "allowed",
    actorId: user.id,
    resourceType: "property",
    resourceId: propertyId,
    detail: { status: parsed.data.status },
  });

  revalidatePath("/admin/properties");
  revalidateTag(CACHE_TAGS.properties, "max");
  revalidatePath("/admin/properties/" + propertyId);
  return { success: true };
}

export async function deleteProperty(propertyId: string) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) return { error: MESSAGES.unauthorized };
  if (!uuid.safeParse(propertyId).success) return { error: MESSAGES.notFound };

  const limit = await limitBy("adminMutation", { userId: user.id });
  if (!limit.ok) return { error: TOO_MANY_REQUESTS };

  const { error } = await supabase
    .from("properties")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", propertyId)
    .is("deleted_at", null);

  if (error) {
    return fail({
      message: MESSAGES.deleteFailed,
      cause: error,
      context: "deleteProperty",
      detail: { propertyId },
    });
  }

  logSecurityEventAsync({
    action: "property.deleted",
    result: "allowed",
    actorId: user.id,
    resourceType: "property",
    resourceId: propertyId,
  });

  revalidatePath("/admin/properties");
  revalidateTag(CACHE_TAGS.properties, "max");
  return { success: true };
}

/**
 * Copies a property into a fresh draft.
 *
 * Two things this now refuses to carry across:
 *
 *   - A DELETED source. The lookup had no `deleted_at IS NULL`, so a
 *     property somebody had removed could be copied straight back into
 *     the active workflow, complete with its old content.
 *   - The VERIFICATION. Spreading the source row copied
 *     verification_state, verified_at and verified_by, so a duplicate of
 *     a verified property arrived claiming a visit that never happened to
 *     it. The copy starts at 'draft', which is what a copy is.
 *
 * Columns are listed rather than spread for the same reason: a new column
 * added to properties should not silently join the copy.
 */
export async function duplicateProperty(propertyId: string) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) return { error: MESSAGES.unauthorized };
  if (!uuid.safeParse(propertyId).success) return { error: MESSAGES.notFound };

  const limit = await limitBy("adminMutation", { userId: user.id });
  if (!limit.ok) return { error: TOO_MANY_REQUESTS };

  const { data: property, error: readError } = await supabase
    .from("properties")
    .select(
      "title, slug, description, address, campus_id, neighbourhood_id, landlord_id, property_type, letting_mode, latitude, longitude, amenities, rules, currency, meta_title, meta_description, commission_bps"
    )
    .eq("id", propertyId)
    .is("deleted_at", null)
    .maybeSingle();

  if (readError) {
    return fail({
      message: MESSAGES.generic,
      cause: readError,
      context: "duplicateProperty:read",
      detail: { propertyId },
    });
  }

  if (!property) return { error: MESSAGES.notFound };

  const { data: created, error } = await supabase
    .from("properties")
    .insert({
      ...property,
      slug: property.slug + "-copy-" + Date.now().toString(36),
      title: property.title + " (Copy)",
      status: "draft" as const,
      verification_state: "draft",
      is_verified: false,
      verified_at: null,
      verified_by: null,
      total_rooms: 0,
      available_rooms: 0,
      deleted_at: null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return fail({
      message: MESSAGES.createFailed,
      cause: error,
      context: "duplicateProperty:insert",
      detail: { propertyId },
    });
  }

  logSecurityEventAsync({
    action: "property.duplicated",
    result: "allowed",
    actorId: user.id,
    resourceType: "property",
    resourceId: created?.id,
    detail: { source_property_id: propertyId },
  });

  revalidatePath("/admin/properties");
  revalidateTag(CACHE_TAGS.properties, "max");
  return { success: true };
}

export async function bulkUpdateStatus(
  propertyIds: string[],
  status: "draft" | "published" | "unpublished" | "archived"
) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) return { error: MESSAGES.unauthorized };

  const parsed = z
    .object({
      propertyIds: bulkIdsSchema,
      status: z.enum(["draft", "published", "unpublished", "archived"]),
    })
    .safeParse({ propertyIds, status });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? MESSAGES.invalidInput };
  }

  const limit = await limitBy("adminBulk", { userId: user.id });
  if (!limit.ok) return { error: TOO_MANY_REQUESTS };

  const { error } = await supabase
    .from("properties")
    .update({ status: parsed.data.status })
    .in("id", parsed.data.propertyIds)
    .is("deleted_at", null);

  if (error) {
    const known = propertySentinels[error.message];
    if (known) return { error: known };
    return fail({
      message: MESSAGES.updateFailed,
      cause: error,
      context: "bulkUpdateStatus",
      detail: { count: parsed.data.propertyIds.length, status: parsed.data.status },
    });
  }

  logSecurityEventAsync({
    action: "property.bulk_status",
    result: "allowed",
    actorId: user.id,
    resourceType: "property",
    detail: { count: parsed.data.propertyIds.length, status: parsed.data.status },
  });

  revalidatePath("/admin/properties");
  revalidateTag(CACHE_TAGS.properties, "max");
  return { success: true };
}

/**
 * Moves a property through the verification machine (migration 016).
 * The legal transitions and the "only a super admin signs off" rule live
 * in the database, so this is a thin, audited wrapper.
 */
export async function setPropertyVerificationState(
  propertyId: string,
  state: "submitted" | "under_review" | "verified" | "suspended" | "archived" | "draft",
  notes?: string
) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) return { error: MESSAGES.unauthorized };
  if (!uuid.safeParse(propertyId).success) return { error: MESSAGES.notFound };

  const limit = await limitBy("adminMutation", { userId: user.id });
  if (!limit.ok) return { error: TOO_MANY_REQUESTS };

  const { error } = await supabase.rpc("set_property_verification_state", {
    p_property_id: propertyId,
    p_state: state,
    p_notes: notes?.slice(0, 2000) ?? undefined,
  });

  if (error) {
    const known = propertySentinels[error.message];
    if (known) {
      logSecurityEventAsync({
        action: "property.verification_changed",
        result: "denied",
        actorId: user.id,
        resourceType: "property",
        resourceId: propertyId,
        detail: { to: state, reason: error.message },
      });
      return { error: known };
    }
    return fail({
      message: MESSAGES.updateFailed,
      cause: error,
      context: "setPropertyVerificationState",
      detail: { propertyId, state },
    });
  }

  logSecurityEventAsync({
    action: "property.verification_changed",
    result: "allowed",
    actorId: user.id,
    resourceType: "property",
    resourceId: propertyId,
    detail: { to: state },
  });

  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${propertyId}`);
  revalidateTag(CACHE_TAGS.properties, "max");
  return { success: true };
}
