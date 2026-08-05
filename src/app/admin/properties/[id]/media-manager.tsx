"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ImagePlus, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Media } from "@/types/database";

// Must match the property-media bucket limits in
// db/migrations/006_media_storage_and_booking_admin.sql
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function MediaManager({
  propertyId,
  initialMedia,
}: {
  propertyId: string;
  initialMedia: Media[];
}) {
  const [media, setMedia] = useState<Media[]>(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);

    const uploaded: Media[] = [];
    for (const file of Array.from(files)) {
      const ext = ALLOWED_TYPES[file.type];
      if (!ext) {
        toast.error(`${file.name}: only JPEG, PNG, and WebP images are allowed.`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name}: images must be 5 MB or smaller.`);
        continue;
      }

      const path = `property/${propertyId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("property-media")
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        toast.error(`${file.name}: ${uploadError.message}`);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("property-media").getPublicUrl(path);

      const { data: row, error: insertError } = await supabase
        .from("media")
        .insert({
          entity_type: "property",
          entity_id: propertyId,
          url: publicUrl,
          storage_path: path,
          mime_type: file.type,
          file_size: file.size,
          display_order: media.length + uploaded.length,
          is_featured: media.length + uploaded.length === 0,
        })
        .select()
        .single();

      if (insertError || !row) {
        await supabase.storage.from("property-media").remove([path]);
        toast.error(`${file.name}: ${insertError?.message ?? "could not save"}`);
        continue;
      }

      uploaded.push(row);
    }

    if (uploaded.length > 0) {
      setMedia((prev) => [...prev, ...uploaded]);
      toast.success(
        uploaded.length === 1 ? "Photo uploaded." : `${uploaded.length} photos uploaded.`
      );
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDelete(item: Media) {
    if (!window.confirm("Delete this photo?")) return;
    setBusyId(item.id);

    const { error } = await supabase.from("media").delete().eq("id", item.id);
    if (error) {
      toast.error(error.message);
      setBusyId(null);
      return;
    }

    await supabase.storage.from("property-media").remove([item.storage_path]);
    setMedia((prev) => prev.filter((m) => m.id !== item.id));
    setBusyId(null);
    toast.success("Photo deleted.");
  }

  async function handleSetFeatured(item: Media) {
    if (item.is_featured) return;
    setBusyId(item.id);

    const { error: clearError } = await supabase
      .from("media")
      .update({ is_featured: false })
      .eq("entity_type", "property")
      .eq("entity_id", propertyId);

    const { error } = clearError
      ? { error: clearError }
      : await supabase.from("media").update({ is_featured: true }).eq("id", item.id);

    if (error) {
      toast.error(error.message);
    } else {
      setMedia((prev) =>
        prev.map((m) => ({ ...m, is_featured: m.id === item.id }))
      );
      toast.success("Cover photo updated.");
    }
    setBusyId(null);
  }

  /** Alt text is what a student on a screen reader gets instead of the
   *  photo, and it is what the listing gallery reads out. Saved on blur
   *  so the operator can tab straight down the column. */
  async function handleAltText(item: Media, value: string) {
    const next = value.trim();
    if (next === (item.alt_text ?? "")) return;

    setMedia((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, alt_text: next || null } : m))
    );

    const { error } = await supabase
      .from("media")
      .update({ alt_text: next || null })
      .eq("id", item.id);

    if (error) {
      toast.error(`Description not saved: ${error.message}`);
      setMedia((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, alt_text: item.alt_text } : m))
      );
    }
  }

  return (
    <section className="rounded-[16px] border border-[var(--line)] bg-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-ink">
            Photos
          </h2>
          <p className="mt-1.5 max-w-[52ch] text-[13px] leading-[1.6] text-muted-foreground">
            Taken on the visit, of the rooms being offered. The starred photo is
            the listing cover. JPEG, PNG or WebP, up to 5&nbsp;MB each.
          </p>
        </div>

        <div className="shrink-0">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[var(--navy)] px-5 text-[13.5px] font-medium text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="size-4" aria-hidden="true" />
            )}
            {uploading ? "Uploading…" : "Upload photos"}
          </button>
        </div>
      </div>

      {media.length === 0 ? (
        <div className="mt-6 rounded-[12px] border border-dashed border-[var(--line-strong)] px-6 py-14 text-center">
          <ImagePlus className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-4 text-[14px] font-medium text-ink">No photos yet</p>
          <p className="mx-auto mt-2 max-w-[46ch] text-[13px] leading-[1.6] text-muted-foreground">
            Until a photo is added, the listing shows a drawn façade and tells
            students the photo arrives after the visit.
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {media.map((item, index) => {
            const altId = `alt-${item.id}`;
            const busy = busyId === item.id;

            return (
              <li key={item.id}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[12px] bg-[var(--paper-warm)]">
                  <Image
                    src={item.url}
                    alt={item.alt_text ?? `Photo ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover"
                  />
                  {item.is_featured && (
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[rgba(255,255,255,0.94)] px-2.5 py-1 text-[11px] font-medium text-ink">
                      <Star className="size-3 fill-current" aria-hidden="true" />
                      Cover
                    </span>
                  )}
                </div>

                {/* Controls sit under the image rather than on hover: an
                    overlay that only appears on :hover is unreachable by
                    keyboard and invisible on touch. */}
                <div className="mt-3">
                  <label
                    htmlFor={altId}
                    className="block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
                  >
                    Describe this photo
                  </label>
                  <input
                    id={altId}
                    defaultValue={item.alt_text ?? ""}
                    placeholder="Bedroom, unit 3"
                    onBlur={(e) => handleAltText(item, e.target.value)}
                    className="mt-1.5 h-10 w-full rounded-[9px] border border-[var(--line-strong)] bg-card px-3 text-[13px] text-ink outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-[var(--teal-deep)]"
                  />

                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetFeatured(item)}
                      disabled={busy || item.is_featured}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-[var(--line-strong)] px-3 text-[12.5px] font-medium text-ink transition-colors hover:border-[var(--ink-soft)] disabled:opacity-40"
                    >
                      <Star className="size-3.5" aria-hidden="true" />
                      {item.is_featured ? "Cover photo" : "Make cover"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      disabled={busy}
                      className="inline-flex h-9 items-center gap-1.5 rounded-[9px] px-3 text-[12.5px] font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-40"
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                      Delete
                    </button>

                    {busy && (
                      <Loader2
                        className="size-4 animate-spin text-muted-foreground"
                        aria-label="Saving"
                      />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
