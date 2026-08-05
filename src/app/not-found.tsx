import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DEFAULT_CAMPUS_SLUG } from "@/lib/constants";
import { HaloftLogo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--paper)]">
      <div className="shell flex h-[76px] items-center">
        <Link href="/" aria-label="Haloft — home">
          <HaloftLogo size={28} markId="notfound" />
        </Link>
      </div>

      <main id="main" className="shell flex flex-1 items-center py-16">
        <div className="max-w-[38rem]">
          <p className="label label-rule max-w-[10rem]">404</p>
          <h1 className="mt-6 display-2 text-ink">
            That address doesn&apos;t exist.
          </h1>
          <p className="lede mt-5">
            The page may have moved, or the listing behind it may have come
            down. Either way, the search still works.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/${DEFAULT_CAMPUS_SLUG}/search`}
              className="group inline-flex h-13 items-center justify-center gap-2 rounded-[10px] bg-[var(--navy)] px-6 text-[14.5px] font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
            >
              Browse homes near campus
              <ArrowRight className="size-4 arrow-nudge" aria-hidden="true" />
            </Link>
            <Link
              href="/"
              className="inline-flex h-13 items-center justify-center rounded-[10px] border border-[var(--line-strong)] px-6 text-[14.5px] font-medium text-ink transition-colors hover:border-[var(--ink-soft)]"
            >
              Back to Haloft
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
