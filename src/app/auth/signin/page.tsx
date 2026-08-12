"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  SERVICE_UNAVAILABLE_MESSAGE,
  SUPABASE_CONFIG_HINT,
  describeAuthError,
} from "@/lib/supabase/config";
import { DEFAULT_CAMPUS_SLUG } from "@/lib/constants";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, Field, authInputClass } from "@/components/layout/auth-shell";
import { guardSignIn, guardMagicLink, recordAuthOutcome } from "../auth-actions";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  /** Guards both handlers: unconfigured builds can only fail as a raw
   *  network error, so stop before the request and explain instead. */
  function backendUnreachable() {
    if (isSupabaseConfigured()) return false;
    console.error(SUPABASE_CONFIG_HINT);
    toast.error(SERVICE_UNAVAILABLE_MESSAGE);
    return true;
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (backendUnreachable()) return;

    setLoading(true);
    try {
      // Counted per address AND per email before the credential is tried,
      // so a distributed attempt on one account trips the same limit a
      // single host would. See src/app/auth/auth-actions.ts.
      const gate = await guardSignIn(email);
      if (!gate.ok) {
        toast.error(gate.error ?? SERVICE_UNAVAILABLE_MESSAGE);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      void recordAuthOutcome("auth.signin", email, !error);

      if (error) {
        toast.error(describeAuthError(error));
      } else {
        toast.success("Welcome back.");
        router.push(`/${DEFAULT_CAMPUS_SLUG}`);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      toast.error(SERVICE_UNAVAILABLE_MESSAGE);
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    if (!email) {
      toast.error("Enter your email address first.");
      return;
    }
    if (backendUnreachable()) return;

    setMagicLoading(true);
    try {
      const gate = await guardMagicLink(email);
      if (!gate.ok) {
        toast.error(gate.error ?? SERVICE_UNAVAILABLE_MESSAGE);
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      void recordAuthOutcome("auth.magic_link", email, !error);

      if (error) {
        toast.error(describeAuthError(error));
      } else {
        toast.success("Sign-in link sent. Check your email.");
      }
    } catch (err) {
      console.error(err);
      toast.error(SERVICE_UNAVAILABLE_MESSAGE);
    } finally {
      setMagicLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick your search back up where you left it."
      footer={
        <>
          New to Haloft?{" "}
          <Link
            href="/auth/signup"
            className="border-b border-[var(--line-strong)] pb-0.5 font-medium text-ink transition-colors hover:border-[var(--teal-deep)]"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSignIn} className="space-y-5">
        <Field label="Email address" htmlFor="email">
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={authInputClass}
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={`${authInputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1.5 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-[8px] text-muted-foreground transition-colors hover:text-ink"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-[18px]" aria-hidden="true" />
              ) : (
                <Eye className="size-[18px]" aria-hidden="true" />
              )}
            </button>
          </div>
        </Field>

        <button
          type="submit"
          disabled={loading}
          className="group inline-flex h-13 w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--navy)] text-[14.5px] font-medium text-white transition-colors hover:bg-[var(--primary-hover)] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <>
              Sign in
              <ArrowRight className="size-4 arrow-nudge" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-[var(--line)]" />
        <span className="text-[11.5px] uppercase tracking-[0.14em] text-muted-foreground">
          or
        </span>
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>

      <button
        type="button"
        onClick={handleMagicLink}
        disabled={magicLoading}
        className="mt-6 inline-flex h-13 w-full items-center justify-center gap-2 rounded-[10px] border border-[var(--line-strong)] text-[14.5px] font-medium text-ink transition-colors hover:border-[var(--ink-soft)] disabled:opacity-50"
      >
        {magicLoading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Email me a sign-in link
      </button>
    </AuthShell>
  );
}
