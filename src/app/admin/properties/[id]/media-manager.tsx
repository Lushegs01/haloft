"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Photos</CardTitle>
          <CardDescription>
            The starred photo is the listing cover. JPEG, PNG, or WebP up to 5 MB.
          </CardDescription>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <Button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="gap-2"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4" />
            )}
            Upload Photos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {media.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg">
            <ImagePlus className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              No photos yet. Listings without photos rarely get bookings.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {media.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border"
              >
                <Image
                  src={item.url}
                  alt={item.alt_text ?? "Property photo"}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover"
                />
                {item.is_featured && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                    <Star className="h-3 w-3 fill-current" />
                    Cover
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1.5 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {busyId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <>
                      {!item.is_featured && (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-7 px-2"
                          onClick={() => handleSetFeatured(item)}
                        >
                          <Star className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="h-7 px-2"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
