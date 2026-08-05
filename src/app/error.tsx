"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import { HaloftLogo } from "@/components/ui/logo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the browser console and server logs; hook up Sentry here later.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--paper)]">
      <div className="shell flex h-[76px] items-center">
        <Link href="/" aria-label="Haloft — home">
          <HaloftLogo size={28} markId="error" />
        </Link>
      </div>

      <main id="main" className="shell flex flex-1 items-center py-16">
        <div className="max-w-[38rem]">
          <p className="label label-rule max-w-[12rem]">Something broke</p>
          <h1 className="mt-6 display-2 text-ink">
            This page didn&apos;t load properly.
          </h1>
          <p className="lede mt-5">
            It&apos;s on our side, not yours. Try again — if it keeps happening,
            the reference below helps us find it.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-13 items-center justify-center gap-2 rounded-[10px] bg-[var(--navy)] px-6 text-[14.5px] font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
            >
              <RotateCw className="size-4" aria-hidden="true" />
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex h-13 items-center justify-center rounded-[10px] border border-[var(--line-strong)] px-6 text-[14.5px] font-medium text-ink transition-colors hover:border-[var(--ink-soft)]"
            >
              Back to Haloft
            </Link>
          </div>

          {error.digest && (
            <p className="mt-10 border-t border-[var(--line)] pt-5 text-[12px] text-muted-foreground">
              Reference: <span className="tabular">{error.digest}</span>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
