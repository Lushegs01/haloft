import { createClient } from "@/lib/supabase/server";
import { sanitizeSearchTerm } from "@/lib/utils";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileText, Search } from "lucide-react";
import { BookingActions } from "./booking-actions";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  let query = supabase
    .from("bookings")
    .select("*, rooms(name), properties(title, slug, campus_id), profiles(full_name), payments(id, status)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const q = params.q ? sanitizeSearchTerm(params.q) : "";
  if (q) {
    query = query.or(
      `profiles.full_name.ilike.%${q}%,properties.title.ilike.%${q}%`
    );
  }
  if (params.status) {
    query = query.eq("status", params.status as "pending" | "confirmed" | "cancelled" | "completed" | "refunded");
  }

  const { data: bookings } = await query;

  const statusColors: Record<string, string> = {
    pending: "bg-amber/10 text-amber border-amber/20",
    confirmed: "bg-success/10 text-success border-success/20",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
    completed: "bg-teal/10 text-teal border-teal/20",
    refunded: "bg-muted text-muted-foreground border-border",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">Manage all student bookings</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <form className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input name="q" placeholder="Search by student or property..." className="pl-10" defaultValue={params.q} />
            </form>
            <div className="flex gap-2">
              {["pending", "confirmed", "cancelled", "completed", "refunded"].map((status) => (
                <Link key={status} href={`/admin/bookings?status=${status}${params.q ? `&q=${params.q}` : ""}`}>
                  <Badge variant={params.status === status ? "default" : "outline"} className="cursor-pointer capitalize">
                    {status}
                  </Badge>
                </Link>
              ))}
              {params.status && (
                <Link href={`/admin/bookings${params.q ? `?q=${params.q}` : ""}`}>
                  <Badge variant="outline" className="cursor-pointer">All</Badge>
                </Link>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {bookings && bookings.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Property</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Room</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dates</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{booking.profiles?.full_name ?? "Unknown"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{booking.properties?.title ?? "N/A"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{booking.rooms?.name ?? "N/A"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={statusColors[booking.status] ?? ""}>
                          {booking.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">
                          {new Date(booking.check_in_date).toLocaleDateString()} -{" "}
                          {new Date(booking.check_out_date).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-medium">₦{booking.total_amount?.toLocaleString()}</p>
                        {booking.payments?.some((p) => p.status === "success") ? (
                          <Badge variant="outline" className="mt-1 bg-success/10 text-success border-success/20">
                            Paid
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unpaid</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <BookingActions bookingId={booking.id} status={booking.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No bookings found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
