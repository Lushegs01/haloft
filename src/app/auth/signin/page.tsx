"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_CAMPUS_SLUG } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Shield, Star, Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { HaloftLogo, HaloftLogoDark } from "@/components/ui/logo";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      router.push(`/${DEFAULT_CAMPUS_SLUG}`);
      router.refresh();
    }

    setLoading(false);
  }

  async function handleMagicLink() {
    if (!email) {
      toast.error("Please enter your email first.");
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Magic link sent! Check your email.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left: Decorative panel ────────────────────── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] relative flex-col justify-between bg-gradient-to-br from-primary via-primary/95 to-orange-600 p-12 text-white shrink-0">
        {/* Background pattern */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-20 -right-20 h-60 w-60 rounded-full bg-white/5 blur-2xl" />
        </div>

        <div className="relative">
          <Link href="/">
            <HaloftLogoDark size={34} />
          </Link>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2
              className="text-4xl font-extrabold leading-tight mb-4"
              style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}
            >
              The smartest way to find student housing
            </h2>
            <p className="text-white/75 text-lg leading-relaxed">
              Verified listings, transparent pricing, and a seamless booking experience — built for Nigerian students.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Shield, text: "Every listing physically verified by our team" },
              { icon: Star, text: "Real reviews from real students" },
              { icon: Users, text: "500+ students already housed through Haloft" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-white/90">
                <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/40 text-xs">
          © {new Date().getFullYear()} Haloft Technologies Ltd.
        </p>
      </div>

      {/* ── Right: Form ───────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 bg-background">
        <div className="w-full max-w-md animate-fade-in">

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/">
              <HaloftLogo size={34} />
            </Link>
          </div>

          <div className="mb-8">
            <h1
              className="text-3xl font-extrabold text-foreground"
              style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}
            >
              Welcome back
            </h1>
            <p className="text-muted-foreground mt-2">
              Sign in to manage your bookings and saved properties.
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="student@funaab.edu.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-border bg-muted/30 focus:bg-background text-base"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                  Password
                </Label>
                <button type="button" className="text-xs text-primary hover:underline font-medium">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 rounded-xl border-border bg-muted/30 focus:bg-background text-base pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-bold shadow-md shadow-primary/20 gap-2 group"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs text-muted-foreground">
              <span className="bg-background px-3">or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-xl text-base font-medium border-border"
            onClick={handleMagicLink}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Send Magic Link to Email
          </Button>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
