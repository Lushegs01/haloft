import { createClient } from "@/lib/supabase/server";
import { sanitizeSearchTerm } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  let query = supabase
    .from("reviews")
    .select("*, properties(title, slug), profiles(full_name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const q = params.q ? sanitizeSearchTerm(params.q) : "";
  if (q) {
    query = query.or(
      `profiles.full_name.ilike.%${q}%,properties.title.ilike.%${q}%,comment.ilike.%${q}%`
    );
  }
  if (params.status === "approved") {
    query = query.eq("is_approved", true);
  } else if (params.status === "pending") {
    query = query.eq("is_approved", false);
  }

  const { data: reviews } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground">Moderate and manage student reviews</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <form className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input name="q" placeholder="Search reviews..." className="pl-10" defaultValue={params.q} />
            </form>
            <div className="flex gap-2">
              <Link href="/admin/reviews?status=approved">
                <Badge variant={params.status === "approved" ? "default" : "outline"} className="cursor-pointer">Approved</Badge>
              </Link>
              <Link href="/admin/reviews?status=pending">
                <Badge variant={params.status === "pending" ? "default" : "outline"} className="cursor-pointer">Pending</Badge>
              </Link>
              {params.status && (
                <Link href="/admin/reviews">
                  <Badge variant="outline" className="cursor-pointer">All</Badge>
                </Link>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reviews && reviews.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Property</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rating</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Comment</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((review) => (
                    <tr key={review.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{review.profiles?.full_name ?? "Unknown"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{review.properties?.title ?? "N/A"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber text-amber" />
                          <span className="font-medium">{review.overall_rating}</span>
                          <span className="text-muted-foreground">/5</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm line-clamp-2">{review.comment ?? "-"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={review.is_approved ? "default" : "outline"} className={review.is_approved ? "bg-success/10 text-success border-success/20" : "bg-amber/10 text-amber border-amber/20"}>
                          {review.is_approved ? "Approved" : "Pending"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Star className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No reviews found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
