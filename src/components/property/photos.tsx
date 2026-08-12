"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Grid2x2, X } from "lucide-react";

/**
 * The gallery and its lightbox — the one genuinely interactive part of a
 * listing page.
 *
 * ── Why this is its own file ────────────────────────────────
 *
 * `property-detail.tsx` was a single 30 KB `"use client"` component. Every
 * student loading a listing downloaded and hydrated the whole thing: the
 * amenity list, the house rules, the room table, the reviews, the price
 * panel — none of which does anything after paint — because three
 * features at the edges needed state.
 *
 * Pulling those three out (this, `ShareButton`, `ExpandableDescription`)
 * lets the page itself be a server component. The static 90% renders to
 * HTML and ships no JavaScript; the parts that respond to a click are
 * islands, and the bundle is the size of the interaction rather than the
 * size of the page.
 *
 * The lightbox does what a modal has to do and is easy to get wrong:
 * traps the scroll, moves focus to the close button, and answers the
 * arrow keys and Escape. Without the keyboard handling this is a picture
 * viewer a keyboard user can open and cannot leave.
 */

export interface PropertyPhoto {
  url: string;
  alt_text: string | null;
  is_featured: boolean;
}

export function PropertyPhotos({
  media,
  title,
}: {
  media: PropertyPhoto[];
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + media.length) % media.length),
    [media.length]
  );
  const next = useCallback(
    () => setIndex((i) => (i + 1) % media.length),
    [media.length]
  );

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", handler);
    };
  }, [open, prev, next, close]);

  function openAt(i: number) {
    setIndex(i);
    setOpen(true);
  }

  return (
    <>
      <div className="hidden grid-cols-4 grid-rows-2 gap-1.5 overflow-hidden rounded-[18px] lg:grid lg:h-[clamp(340px,38vw,460px)]">
        <button
          type="button"
          onClick={() => openAt(0)}
          className="relative col-span-2 row-span-2 cursor-zoom-in bg-[var(--paper-warm)]"
        >
          <Image
            src={media[0].url}
            alt={media[0].alt_text ?? title}
            fill
            priority
            className="object-cover transition-opacity hover:opacity-95"
            sizes="50vw"
          />
        </button>
        {media.slice(1, 5).map((m, i) => (
          <button
            key={m.url}
            type="button"
            onClick={() => openAt(i + 1)}
            className="relative cursor-zoom-in bg-[var(--paper-warm)]"
          >
            <Image
              src={m.url}
              alt={m.alt_text ?? `${title} — photo ${i + 2}`}
              fill
              className="object-cover transition-opacity hover:opacity-95"
              sizes="25vw"
            />
          </button>
        ))}
        {media.length > 5 && (
          <button
            type="button"
            onClick={() => openAt(0)}
            className="absolute bottom-4 right-4 inline-flex h-10 items-center gap-2 rounded-[10px] bg-[rgba(255,255,255,0.95)] px-4 text-[13px] font-medium text-ink shadow-ambient transition-colors hover:bg-white"
          >
            <Grid2x2 className="size-4" aria-hidden="true" />
            All {media.length} photos
          </button>
        )}
      </div>

      <div className="rail scrollbar-hide -mx-5 flex gap-2 overflow-x-auto px-5 sm:-mx-8 sm:px-8 lg:hidden">
        {media.map((m, i) => (
          <button
            key={m.url}
            type="button"
            onClick={() => openAt(i)}
            className="relative aspect-[4/3] w-[82vw] max-w-[26rem] shrink-0 overflow-hidden rounded-[14px] bg-[var(--paper-warm)]"
          >
            <Image
              src={m.url}
              alt={m.alt_text ?? `${title} — photo ${i + 1}`}
              fill
              priority={i === 0}
              className="object-cover"
              sizes="82vw"
            />
          </button>
        ))}
      </div>

      {open && media.length > 0 && (
        <div
          className="fade-in fixed inset-0 z-[100] flex flex-col bg-[rgba(10,15,20,0.97)]"
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photos`}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <p className="text-[13px] text-white/60 tabular">
              {index + 1} / {media.length}
            </p>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={close}
              className="inline-flex size-11 items-center justify-center rounded-[10px] text-white transition-colors hover:bg-white/10"
              aria-label="Close photos"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center px-4">
            {media.length > 1 && (
              <button
                type="button"
                onClick={prev}
                className="absolute left-3 z-10 inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Previous photo"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
            )}

            <div className="relative aspect-[4/3] w-full max-w-4xl">
              <Image
                src={media[index]?.url ?? ""}
                alt={media[index]?.alt_text ?? `${title} photo`}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>

            {media.length > 1 && (
              <button
                type="button"
                onClick={next}
                className="absolute right-3 z-10 inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Next photo"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            )}
          </div>

          {media.length > 1 && (
            <div className="scrollbar-hide flex gap-2 overflow-x-auto px-5 py-4">
              {media.map((m, i) => (
                <button
                  key={m.url}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`relative size-16 shrink-0 overflow-hidden rounded-[8px] transition-opacity ${
                    i === index ? "ring-2 ring-white" : "opacity-55 hover:opacity-100"
                  }`}
                  aria-label={`Photo ${i + 1}`}
                >
                  <Image src={m.url} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
