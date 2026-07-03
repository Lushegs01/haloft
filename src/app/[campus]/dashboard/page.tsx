import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Home,
  Calendar,
  Heart,
  Star,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Phone,
  Mail,
  User,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { CancelBookingButton } from "./cancel-booking-button";

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ campus: string }>;
}) {
  const { campus } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/auth/signin");
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, rooms(name, price_per_month), properties(title, slug, campus_id)")
    .eq("student_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: favorites } = await supabase
    .from("favorites")
    .select("*, properties(title, slug, campus_id, min_price, max_price)")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, properties(title, slug, campus_id)")
    .eq("student_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    pending: {
      color: "bg-amber/10 text-amber border-amber/20",
      icon: <Clock className="h-3 w-3" />,
      label: "Pending",
    },
    confirmed: {
      color: "bg-success/10 text-success border-success/20",
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: "Confirmed",
    },
    cancelled: {
      color: "bg-destructive/10 text-destructive border-destructive/20",
      icon: <XCircle className="h-3 w-3" />,
      label: "Cancelled",
    },
    completed: {
      color: "bg-teal/10 text-teal border-teal/20",
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: "Completed",
    },
    refunded: {
      color: "bg-muted text-muted-foreground border-border",
      icon: <RefreshCw className="h-3 w-3" />,
      label: "Refunded",
    },
  };

  const firstName = profile.full_name?.split(" ")[0] ?? "Student";
  const initial = (profile.full_name?.[0] ?? user.email?.[0] ?? "S").toUpperCase();

  const statsItems = [
    { label: "Bookings", value: bookings?.length ?? 0, icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
    { label: "Saved", value: favorites?.length ?? 0, icon: Heart, color: "text-rose", bg: "bg-rose/10" },
    { label: "Reviews", value: reviews?.length ?? 0, icon: Star, color: "text-amber", bg: "bg-amber/10" },
  ];

  return (
    <div className="min-h-full bg-muted/20 pb-20 md:pb-0">
      {/* ── Profile Hero ──────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary/8 via-background to-background border-b border-border">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-primary/30 shrink-0">
              {initial}
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-medium">Welcome back 👋</p>
              <h1
                className="text-2xl font-extrabold text-foreground mt-0.5"
                style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}
              >
                {profile.full_name ?? "Student"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
            </div>
            <Link href={`/${campus}/search`}>
              <Button size="sm" className="rounded-full gap-2 shadow-sm shrink-0">
                <Home className="h-4 w-4" />
                Find rooms
              </Button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {statsItems.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
                <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center mx-auto mb-2`}>
                  <s.icon className={`h-4.5 w-4.5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-inter)" }}>
                  {s.value}
                </p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main: Bookings + Reviews ──────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Bookings */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <h2
                    className="font-bold text-foreground"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    My Bookings
                  </h2>
                </div>
                <Link href={`/${campus}/search`}>
                  <Button size="sm" variant="ghost" className="text-primary hover:text-primary gap-1 text-sm font-medium">
                    Find room <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="p-5">
                {bookings && bookings.length > 0 ? (
                  <div className="space-y-3">
                    {bookings.map((booking) => {
                      const s = statusConfig[booking.status] ?? statusConfig.pending;
                      return (
                        <div
                          key={booking.id}
                          className="rounded-xl border border-border bg-muted/20 p-4 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">
                                {booking.properties?.title ?? "Property"}
                              </p>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                Room: {booking.rooms?.name ?? "N/A"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(booking.check_in_date).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                                {" — "}
                                {new Date(booking.check_out_date).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border ${s.color}`}
                              >
                                {s.icon}
                                {s.label}
                              </span>
                              {(booking.status === "pending" || booking.status === "confirmed") && (
                                <CancelBookingButton bookingId={booking.id} campusSlug={campus} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                      <Home className="h-7 w-7 text-muted-foreground/50" />
                    </div>
                    <p className="font-semibold text-foreground mb-1">No bookings yet</p>
                    <p className="text-sm text-muted-foreground mb-4">Find your perfect room and make your first booking.</p>
                    <Link href={`/${campus}/search`}>
                      <Button size="sm" className="rounded-full">Find accommodation</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                <div className="h-8 w-8 rounded-xl bg-amber/10 flex items-center justify-center">
                  <Star className="h-4 w-4 text-amber" />
                </div>
                <h2
                  className="font-bold text-foreground"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  My Reviews
                </h2>
              </div>
              <div className="p-5">
                {reviews && reviews.length > 0 ? (
                  <div className="space-y-3">
                    {reviews.map((review) => (
                      <div key={review.id} className="rounded-xl border border-border bg-muted/20 p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="font-semibold text-foreground text-sm">
                            {review.properties?.title ?? "Property"}
                          </p>
                          <div className="flex gap-0.5 shrink-0">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${i < review.overall_rating ? "fill-amber text-amber" : "text-muted-foreground/20"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
                        {!review.is_approved && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber/10 text-amber border border-amber/20 px-2.5 py-1 text-xs font-medium mt-2">
                            <Clock className="h-3 w-3" />
                            Pending approval
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Star className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">No reviews yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Reviews appear here after your completed stays.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Sidebar: Profile + Favorites ────────────── */}
          <div className="space-y-6">

            {/* Profile card */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <h2
                  className="font-bold text-foreground"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  Profile
                </h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{profile.full_name ?? "Student"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-border space-y-2">
                  {profile.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      {profile.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Favorites */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
                <div className="h-8 w-8 rounded-xl bg-rose/10 flex items-center justify-center">
                  <Heart className="h-4 w-4 text-rose" />
                </div>
                <h2
                  className="font-bold text-foreground"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  Saved Properties
                </h2>
              </div>
              <div className="p-4">
                {favorites && favorites.length > 0 ? (
                  <div className="space-y-2">
                    {favorites.map((fav) => (
                      <Link
                        key={fav.id}
                        href={`/${campus}/property/${fav.properties?.slug}`}
                        className="flex items-center gap-3 rounded-xl p-3 hover:bg-muted transition-colors group"
                      >
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <Home className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                            {fav.properties?.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            From ₦{fav.properties?.min_price?.toLocaleString() ?? "N/A"}/mo
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Heart className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground font-medium">No saved properties</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Tap the heart icon on any listing to save it.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
