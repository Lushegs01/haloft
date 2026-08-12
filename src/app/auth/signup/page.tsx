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
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, Field, authInputClass } from "@/components/layout/auth-shell";
import { guardSignUp, recordAuthOutcome } from "../auth-actions";

const STRENGTH = [
  { key: "weak", label: "Weak", color: "bg-[var(--destructive)]" },
  { key: "fair", label: "Fair", color: "bg-[var(--sand-deep)]" },
  { key: "strong", label: "Strong", color: "bg-[var(--teal-deep)]" },
] as const;

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();

    // Without the public Supabase vars every request goes to a dead local
    // address and fails as "Failed to fetch". Say so up front rather than
    // spinning and then showing the visitor a browser-level network error.
    if (!isSupabaseConfigured()) {
      console.error(SUPABASE_CONFIG_HINT);
      toast.error(SERVICE_UNAVAILABLE_MESSAGE);
      return;
    }

    setLoading(true);
    try {
      // Signup is the cheapest thing to automate against a marketplace —
      // it creates rows, sends mail on our domain's reputation, and needs
      // no credential to attempt. Limited per address and per email.
      const gate = await guardSignUp(email);
      if (!gate.ok) {
        toast.error(gate.error ?? SERVICE_UNAVAILABLE_MESSAGE);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      void recordAuthOutcome("auth.signup", email, !error);

      if (error) {
        toast.error(describeAuthError(error));
      } else if (data.user) {
        toast.success("Account created. Check your email to confirm it.");
        router.push("/auth/signin");
      }
    } catch (err) {
      // supabase-js throws instead of returning when fetch itself rejects.
      console.error(err);
      toast.error(SERVICE_UNAVAILABLE_MESSAGE);
    } finally {
      setLoading(false);
    }
  }

  const strength =
    password.length === 0
      ? null
      : password.length < 8
        ? STRENGTH[0]
        : password.length < 12
          ? STRENGTH[1]
          : STRENGTH[2];
  const strengthIndex = strength ? STRENGTH.indexOf(strength) : -1;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Free to join. You only pay once a booking is confirmed."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="border-b border-[var(--line-strong)] pb-0.5 font-medium text-ink transition-colors hover:border-[var(--teal-deep)]"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSignUp} className="space-y-5">
        <Field label="Full name" htmlFor="fullName">
          <input
            id="fullName"
            autoComplete="name"
            placeholder="Your name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className={authInputClass}
          />
        </Field>

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

        <Field
          label="Phone number"
          htmlFor="phone"
          hint={<span className="text-[12px] text-muted-foreground">Optional</span>}
        >
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+234 801 234 5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={authInputClass}
          />
        </Field>

        <Field label="Password" htmlFor="password">
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              aria-describedby="password-strength"
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

          {strength && (
            <div id="password-strength" className="mt-2.5 flex items-center gap-3">
              <div className="flex flex-1 gap-1.5">
                {STRENGTH.map((level, i) => (
                  <span
                    key={level.key}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= strengthIndex ? strength.color : "bg-[var(--line)]"
                    }`}
                  />
                ))}
              </div>
              <span className="text-[12px] text-muted-foreground" aria-live="polite">
                {strength.label}
              </span>
            </div>
          )}
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
              Create account
              <ArrowRight className="size-4 arrow-nudge" aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="mt-5 text-[12.5px] leading-[1.6] text-muted-foreground">
        By creating an account you agree to our{" "}
        <Link
          href="/legal/terms"
          className="text-ink underline decoration-[var(--line-strong)] underline-offset-2 transition-colors hover:decoration-[var(--teal-deep)]"
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          href="/legal/privacy"
          className="text-ink underline decoration-[var(--line-strong)] underline-offset-2 transition-colors hover:decoration-[var(--teal-deep)]"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </AuthShell>
  );
}
