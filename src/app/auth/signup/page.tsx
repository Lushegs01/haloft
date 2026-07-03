"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Star,
  Users,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

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
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      toast.success("Account created! Check your email to confirm.");
      router.push("/auth/signin");
    }

    setLoading(false);
  }

  const passwordStrength =
    password.length === 0 ? null
    : password.length < 6 ? "weak"
    : password.length < 10 ? "fair"
    : "strong";

  return (
    <div className="min-h-screen flex">

      {/* ── Left: Decorative panel ────────────────────── */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] relative flex-col justify-between bg-gradient-to-br from-primary via-primary/95 to-orange-600 p-12 text-white shrink-0">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-20 -right-20 h-60 w-60 rounded-full bg-white/5 blur-2xl" />
        </div>

        <div className="relative">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-bold" style={{ fontFamily: "var(--font-inter)" }}>H</span>
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}>
              Haloft
            </span>
          </Link>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2
              className="text-4xl font-extrabold leading-tight mb-4"
              style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}
            >
              Join thousands of students finding great rooms
            </h2>
            <p className="text-white/75 text-lg leading-relaxed">
              Create a free account and start browsing verified accommodation near your campus today.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: Shield, text: "100% free to browse and book" },
              { icon: Star, text: "Real photos, real prices, no surprises" },
              { icon: Users, text: "Join 500+ students already on Haloft" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-white/90">
                <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-sm">{text}</p>
              </div>
            ))}
          </div>

          {/* Mini testimonial */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4 border border-white/10">
            <div className="flex gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-4 w-4 fill-white/80 text-white/80" />
              ))}
            </div>
            <p className="text-white/90 text-sm italic leading-relaxed">
              &quot;Found my hostel in 20 minutes. No agents, no stress — just great options close to campus.&quot;
            </p>
            <p className="text-white/60 text-xs mt-2">— Adaeze O., FUNAAB student</p>
          </div>
        </div>

        <p className="relative text-white/40 text-xs">
          © {new Date().getFullYear()} Haloft Technologies Ltd.
        </p>
      </div>

      {/* ── Right: Form ───────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12 bg-background overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in">

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                <span className="text-white font-bold" style={{ fontFamily: "var(--font-inter)" }}>H</span>
              </div>
              <span className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}>
                Haloft
              </span>
            </Link>
          </div>

          <div className="mb-8">
            <h1
              className="text-3xl font-extrabold text-foreground"
              style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}
            >
              Create your account
            </h1>
            <p className="text-muted-foreground mt-2">
              Free forever. No credit card required.
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-semibold text-foreground">
                Full name
              </Label>
              <Input
                id="fullName"
                placeholder="Adaeze Okonkwo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12 rounded-xl border-border bg-muted/30 focus:bg-background text-base"
              />
            </div>

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
              <Label htmlFor="phone" className="text-sm font-semibold text-foreground">
                Phone number{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+234 801 234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 rounded-xl border-border bg-muted/30 focus:bg-background text-base"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
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

              {/* Password strength */}
              {passwordStrength && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex gap-1 flex-1">
                    {["weak", "fair", "strong"].map((level, i) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-all ${
                          (passwordStrength === "weak" && i === 0) ||
                          (passwordStrength === "fair" && i <= 1) ||
                          (passwordStrength === "strong")
                            ? passwordStrength === "weak"
                              ? "bg-destructive"
                              : passwordStrength === "fair"
                              ? "bg-amber"
                              : "bg-success"
                            : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-medium capitalize ${
                    passwordStrength === "weak" ? "text-destructive"
                    : passwordStrength === "fair" ? "text-amber"
                    : "text-success"
                  }`}>
                    {passwordStrength}
                  </span>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-bold shadow-md shadow-primary/20 gap-2 group mt-2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          {/* Trust note */}
          <div className="flex items-start gap-2 mt-5 rounded-xl bg-muted/50 border border-border p-3">
            <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              By creating an account you agree to our{" "}
              <Link href="/" className="text-primary hover:underline font-medium">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/" className="text-primary hover:underline font-medium">Privacy Policy</Link>.
              We will never share your data.
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
