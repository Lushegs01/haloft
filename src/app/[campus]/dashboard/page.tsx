import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Calendar, Heart, Star } from "lucide-react";
import Link from "next/link";
import { CancelBookingButton } from "./cancel-booking-button";

export default async function StudentDashboardPage({
  params,
}: {
  params: Promise<{ campus: string }>;
}) {
  const { campus } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

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
    .limit(5);

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, properties(title, slug, campus_id)")
    .eq("student_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const statusColors: Record<string, string> = {
    pending: "bg-amber/10 text-amber",
    confirmed: "bg-success/10 text-success",
    cancelled: "bg-destructive/10 text-destructive",
    completed: "bg-teal/10 text-teal",
    refunded: "bg-muted text-muted-foreground",
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {profile.full_name ?? "Student"}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bookings */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  My Bookings
                </CardTitle>
                <CardDescription>Your accommodation bookings</CardDescription>
              </div>
              <Link href={`/${campus}/search`}>
                <Button size="sm">Find New Room</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {bookings && bookings.length > 0 ? (
                <div className="space-y-3">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border"
                    >
                      <div>
                        <p className="font-medium">{booking.properties?.title ?? "Property"}</p>
                        <p className="text-sm text-muted-foreground">
                          Room: {booking.rooms?.name ?? "N/A"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.check_in_date).toLocaleDateString()} -{" "}
                          {new Date(booking.check_out_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className={statusColors[booking.status] ?? ""}>
                          {booking.status}
                        </Badge>
                        {(booking.status === "pending" || booking.status === "confirmed") && (
                          <CancelBookingButton bookingId={booking.id} campusSlug={campus} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Home className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No bookings yet</p>
                  <Link href={`/${campus}/search`}>
                    <Button className="mt-4" size="sm">Find Accommodation</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                My Reviews
              </CardTitle>
              <CardDescription>Reviews you have submitted</CardDescription>
            </CardHeader>
            <CardContent>
              {reviews && reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-3 rounded-lg border border-border"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{review.properties?.title ?? "Property"}</p>
                        <div className="flex gap-1">
                          {Array.from({ length: review.overall_rating }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-amber text-amber" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.comment}</p>
                      {!review.is_approved && (
                        <Badge variant="outline" className="mt-2 bg-amber/10 text-amber">
                          Pending approval
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No reviews yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-medium text-primary">
                    {profile.full_name?.[0] ?? user.email?.[0] ?? "S"}
                  </div>
                  <div>
                    <p className="font-medium">{profile.full_name ?? "Student"}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground">Phone: {profile.phone ?? "Not set"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Favorites */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Favorites
              </CardTitle>
            </CardHeader>
            <CardContent>
              {favorites && favorites.length > 0 ? (
                <div className="space-y-3">
                  {favorites.map((fav) => (
                    <Link
                      key={fav.id}
                      href={`/${campus}/property/${fav.properties?.slug}`}
                      className="block p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      <p className="font-medium text-sm">{fav.properties?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        ₦{fav.properties?.min_price?.toLocaleString() ?? "N/A"} - {" "}
                        ₦{fav.properties?.max_price?.toLocaleString() ?? "N/A"}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No favorites yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
