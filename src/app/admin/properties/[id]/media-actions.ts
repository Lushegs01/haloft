"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminUser } from "@/lib/auth/admin";
import { CACHE_TAGS } from "@/lib/data/campus";
import { inspectImage, MAX_IMAGE_BYTES } from "@/lib/images";
import { limitBy, TOO_MANY_REQUESTS } from "@/lib/rate-limit";
import { logSecurityEventAsync } from "@/lib/security-log";
import { fail, MESSAGES } from "@/lib/errors";
import { z } from "zod";

/**
 * Photo upload, moved off the browser.
 *
 * It used to happen entirely client-side: the browser checked
 * `file.type` and `file.size`, called `supabase.storage.upload()` with
 * the anon key, and then inserted the `media` row itself. Storage RLS and
 * the bucket's MIME list were the only server-side checks, and both of
 * them trust the Content-Type the uploader sends.
 *
 * Now the bytes come to the server first, get read for what they actually
 * are (see src/lib/images.ts), lose their metadata, and are written with
 * the service role under a path derived from the property — never from
 * anything the client names. The `media` row and the object are created
 * together, and a failure on either side cleans up the other, so the
 * table cannot end up pointing at an object that is not there.
 */

const uuid = z.string().uuid();

export interface UploadResult {
  uploaded: number;
  failed: Array<{ name: string; reason: string }>;
  error?: string;
}

export async function uploadPropertyMedia(
  propertyId: string,
  formData: FormData
): Promise<UploadResult> {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) {
    logSecurityEventAsync({
      action: "media.uploaded",
      result: "denied",
      resourceType: "property",
      resourceId: propertyId,
      detail: { reason: "not an admin" },
    });
    return { uploaded: 0, failed: [], error: MESSAGES.unauthorized };
  }

  if (!uuid.safeParse(propertyId).success) {
    return { uploaded: 0, failed: [], error: MESSAGES.notFound };
  }

  const limit = await limitBy("media", { userId: user.id });
  if (!limit.ok) {
    return { uploaded: 0, failed: [], error: TOO_MANY_REQUESTS };
  }

  // Campus scoping. The storage policies (017) check the same thing from
  // the object path, but this runs first so a refusal is a sentence
  // rather than a policy violation, and so nothing is uploaded before the
  // authorization question is settled.
  const { data: property } = await supabase
    .from("properties")
    .select("id, campus_id")
    .eq("id", propertyId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!property) {
    return { uploaded: 0, failed: [], error: MESSAGES.notFound };
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return { uploaded: 0, failed: [], error: "No files were received." };
  }
  if (files.length > 20) {
    return { uploaded: 0, failed: [], error: "Upload up to 20 photos at a time." };
  }

  const { count: existing } = await supabase
    .from("media")
    .select("id", { count: "exact", head: true })
    .eq("entity_type", "property")
    .eq("entity_id", propertyId)
    .is("deleted_at", null);

  let order = existing ?? 0;
  const result: UploadResult = { uploaded: 0, failed: [] };

  for (const file of files) {
    if (file.size > MAX_IMAGE_BYTES) {
      result.failed.push({ name: file.name, reason: "Images must be 5 MB or smaller." });
      continue;
    }

    const inspection = inspectImage(await file.arrayBuffer(), file.type || undefined);

    if (!inspection.ok) {
      result.failed.push({ name: file.name, reason: inspection.reason });
      logSecurityEventAsync({
        action: "media.rejected",
        result: "denied",
        actorId: user.id,
        resourceType: "property",
        resourceId: propertyId,
        detail: { filename: file.name, claimed_type: file.type, reason: inspection.reason },
      });
      continue;
    }

    // `property/<id>/<uuid>.<ext>` — the shape the storage policies parse
    // for authorization, and nothing in it comes from the filename.
    const path = `property/${propertyId}/${crypto.randomUUID()}.${inspection.extension}`;

    const { error: uploadError } = await supabase.storage
      .from("property-media")
      .upload(path, inspection.bytes, {
        contentType: inspection.mimeType,
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      result.failed.push({ name: file.name, reason: "Could not store that photo." });
      console.error(`[media] upload failed for ${file.name}: ${uploadError.message}`);
      continue;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("property-media").getPublicUrl(path);

    const { error: insertError } = await supabase.from("media").insert({
      entity_type: "property",
      entity_id: propertyId,
      url: publicUrl,
      storage_path: path,
      mime_type: inspection.mimeType,
      file_size: inspection.bytes.length,
      width: inspection.width,
      height: inspection.height,
      display_order: order,
      // The first photo for a property becomes its cover. The partial
      // unique index from 017 is what guarantees there is only ever one.
      is_featured: order === 0,
      created_by: user.id,
    });

    if (insertError) {
      // Leave no orphan object behind.
      await supabase.storage.from("property-media").remove([path]);
      result.failed.push({ name: file.name, reason: "Could not save that photo." });
      console.error(`[media] row insert failed for ${path}: ${insertError.message}`);
      continue;
    }

    logSecurityEventAsync({
      action: "media.uploaded",
      result: "allowed",
      actorId: user.id,
      resourceType: "property",
      resourceId: propertyId,
      detail: {
        path,
        bytes: inspection.bytes.length,
        metadata_stripped: inspection.bytesRemoved,
        dimensions: `${inspection.width}x${inspection.height}`,
      },
    });

    order += 1;
    result.uploaded += 1;
  }

  if (result.uploaded > 0) {
    revalidatePath(`/admin/properties/${propertyId}`);
    revalidateTag(CACHE_TAGS.properties, "max");
  }

  return result;
}

export async function deletePropertyMedia(mediaId: string) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) return { error: MESSAGES.unauthorized };
  if (!uuid.safeParse(mediaId).success) return { error: MESSAGES.notFound };

  const { data: media } = await supabase
    .from("media")
    .select("id, storage_path, entity_id, entity_type")
    .eq("id", mediaId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!media) return { error: MESSAGES.notFound };

  const { error } = await supabase.from("media").delete().eq("id", mediaId);

  if (error) {
    return fail({
      message: MESSAGES.deleteFailed,
      cause: error,
      context: "deletePropertyMedia",
      detail: { mediaId },
    });
  }

  // The row is the record; a stored object left behind is waste, not a
  // correctness problem, so a failure here is logged rather than surfaced.
  const { error: storageError } = await supabase.storage
    .from("property-media")
    .remove([media.storage_path]);

  if (storageError) {
    console.error(`[media] object ${media.storage_path} not removed: ${storageError.message}`);
  }

  logSecurityEventAsync({
    action: "media.deleted",
    result: "allowed",
    actorId: user.id,
    resourceType: "media",
    resourceId: mediaId,
    detail: { property_id: media.entity_id },
  });

  revalidatePath(`/admin/properties/${media.entity_id}`);
  revalidateTag(CACHE_TAGS.properties, "max");
  return { success: true };
}

/**
 * Makes a photo the listing cover.
 *
 * The browser used to do this as two updates — clear every cover for the
 * property, then set one — which leaves a window where the property has
 * no cover at all and two operators can interleave into having two.
 * `set_featured_media` (017) does both under one lock, in one
 * transaction, behind a unique index that makes the bad state impossible.
 */
export async function setFeaturedMedia(mediaId: string) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) return { error: MESSAGES.unauthorized };
  if (!uuid.safeParse(mediaId).success) return { error: MESSAGES.notFound };

  const { data: media, error } = await supabase.rpc("set_featured_media", {
    p_media_id: mediaId,
  });

  const sentinels: Record<string, string> = {
    AUTH_REQUIRED: MESSAGES.unauthorized,
    ADMIN_ONLY: MESSAGES.unauthorized,
    MEDIA_NOT_FOUND: MESSAGES.notFound,
  };

  if (error) {
    const known = sentinels[error.message];
    if (known) return { error: known };

    return fail({
      message: MESSAGES.updateFailed,
      cause: error,
      context: "setFeaturedMedia",
      detail: { mediaId },
    });
  }

  logSecurityEventAsync({
    action: "media.featured",
    result: "allowed",
    actorId: user.id,
    resourceType: "media",
    resourceId: mediaId,
    detail: { property_id: media?.entity_id },
  });

  if (media?.entity_id) {
    revalidatePath(`/admin/properties/${media.entity_id}`);
  }
  revalidateTag(CACHE_TAGS.properties, "max");
  return { success: true };
}

export async function updateMediaAltText(mediaId: string, altText: string) {
  const supabase = await createClient();
  const user = await getAdminUser(supabase);

  if (!user) return { error: MESSAGES.unauthorized };
  if (!uuid.safeParse(mediaId).success) return { error: MESSAGES.notFound };

  const text = altText.trim().slice(0, 300);

  const { data: media, error } = await supabase
    .from("media")
    .update({ alt_text: text || null })
    .eq("id", mediaId)
    .is("deleted_at", null)
    .select("entity_id")
    .maybeSingle();

  if (error) {
    return fail({
      message: "Description not saved.",
      cause: error,
      context: "updateMediaAltText",
      detail: { mediaId },
    });
  }

  if (media?.entity_id) {
    revalidatePath(`/admin/properties/${media.entity_id}`);
    revalidateTag(CACHE_TAGS.properties, "max");
  }
  return { success: true };
}
