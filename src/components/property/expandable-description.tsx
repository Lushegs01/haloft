"use client";

import { useState } from "react";

/**
 * A long description, clamped until asked for.
 *
 * The full text is always in the HTML — the clamp is CSS, not a
 * substring — so a crawler and a screen reader get the whole thing
 * whatever the button says. Truncating in JavaScript would have hidden
 * half of every listing's copy from search.
 */
export function ExpandableDescription({
  text,
  clampAt = 420,
}: {
  text: string;
  clampAt?: number;
}) {
  const [open, setOpen] = useState(false);
  const isLong = text.length > clampAt;

  return (
    <>
      <p
        className={`mt-4 max-w-[62ch] text-[15px] leading-[1.7] text-ink-soft ${
          open || !isLong ? "" : "line-clamp-4"
        }`}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-3 border-b border-[var(--line-strong)] pb-0.5 text-[13.5px] font-medium text-ink transition-colors hover:border-[var(--teal-deep)]"
        >
          {open ? "Show less" : "Read the full description"}
        </button>
      )}
    </>
  );
}
