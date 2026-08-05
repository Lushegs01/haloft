import Link from "next/link";
import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { HaloftLogo } from "@/components/ui/logo";
import { Elevation } from "@/components/haloft/elevation";
import { AppToaster } from "@/components/ui/app-toaster";

const PROMISES = [
  "Ask for a room without paying anyone to see an address.",
  "Keep every request, booking and receipt in one place.",
  "Review a home after you've actually lived in it.",
];

/**
 * Shared frame for sign-in and sign-up: a dark editorial panel on the
 * left with the brand and what an account is actually for, the form on
 * the right. The panel collapses on small screens rather than shrinking.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AppToaster />
      <aside className="relative hidden shrink-0 flex-col justify-between overflow-hidden bg-[var(--night)] p-12 text-white lg:flex lg:w-[27rem] xl:w-[32rem]">
        {/* The façade sits under the copy as texture, not as an image:
            faded right down and masked away before it reaches the text. */}
        <div
          className="absolute inset-x-0 bottom-0 h-[46%] opacity-[0.09] [mask-image:linear-gradient(to_top,black_15%,transparent)]"
          aria-hidden="true"
        >
          <div className="relative h-full w-full">
            <Elevation variant="court" />
          </div>
        </div>

        <Link href="/" aria-label="Haloft — home" className="relative">
          <HaloftLogo size={30} tone="light" markId="auth" />
        </Link>

        <div className="relative">
          <h2 className="display-3 max-w-[15ch] text-white">
            Somewhere to keep your search.
          </h2>
          <ul className="mt-9 space-y-4 border-t border-white/12 pt-8">
            {PROMISES.map((promise) => (
              <li key={promise} className="flex items-start gap-3.5">
                <Check className="mt-0.5 size-4 shrink-0 text-[#7fd4c6]" aria-hidden="true" />
                <span className="max-w-[36ch] text-[14px] leading-[1.6] text-white/75">
                  {promise}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12px] text-white/40">
          © {new Date().getFullYear()} Haloft. All rights reserved.
        </p>
      </aside>

      <main id="main" className="flex flex-1 items-center justify-center px-5 py-14 sm:px-8">
        <div className="w-full max-w-[25rem]">
          <div className="mb-9 lg:hidden">
            <Link href="/" aria-label="Haloft — home">
              <HaloftLogo size={28} markId="auth-mobile" />
            </Link>
          </div>

          <h1 className="display-3 text-ink">{title}</h1>
          <p className="mt-2.5 text-[14.5px] leading-[1.6] text-muted-foreground">
            {subtitle}
          </p>

          <div className="mt-8">{children}</div>

          <div className="mt-8 border-t border-[var(--line)] pt-6 text-[13.5px] text-muted-foreground">
            {footer}
          </div>
        </div>
      </main>
    </div>
  );
}

/** Field wrapper so both auth forms share label + spacing decisions. */
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-[13px] font-medium text-ink"
        >
          {label}
        </label>
        {hint}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export const authInputClass =
  "h-12 w-full rounded-[10px] border border-[var(--line-strong)] bg-card px-3.5 text-[15px] text-ink outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-[var(--teal-deep)]";
