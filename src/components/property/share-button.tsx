"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

/**
 * Share, with the Web Share sheet where it exists and the clipboard
 * everywhere else.
 *
 * An island rather than part of the page: this is one button and two
 * lines of state, and it used to be the reason a listing page shipped as
 * a client component in its entirety.
 */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* the user dismissed the sheet — fall through to copying */
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* clipboard unavailable — nothing sensible left to do */
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex h-9 items-center gap-2 rounded-[9px] border border-[var(--line-strong)] px-3 text-[13px] font-medium text-ink transition-colors hover:border-[var(--ink-soft)]"
    >
      <Share2 className="size-3.5" aria-hidden="true" />
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
