import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, DollarSign, Users, Building2, FileText } from "lucide-react";

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const { data: properties } = await supabase
    .from("properties")
    .select("status, total_rooms, available_rooms, property_type, campus_id")
    .is("deleted_at", null);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("status, total_amount, currency, created_at")
    .is("deleted_at", null);

  const { data: students } = await supabase
    .from("profiles")
    .select("role", { count: "exact" })
    .eq("role", "student")
    .is("deleted_at", null);

  const totalProperties = properties?.length ?? 0;
  const publishedProperties = properties?.filter(p => p.status === "published").length ?? 0;
  const totalRooms = properties?.reduce((sum, p) => sum + (p.total_rooms ?? 0), 0) ?? 0;
  const availableRooms = properties?.reduce((sum, p) => sum + (p.available_rooms ?? 0), 0) ?? 0;
  const occupancyRate = totalRooms > 0 ? Math.round(((totalRooms - availableRooms) / totalRooms) * 100) : 0;

  const totalBookings = bookings?.length ?? 0;
  const confirmedBookings = bookings?.filter(b => b.status === "confirmed" || b.status === "completed").length ?? 0;
  const pendingBookings = bookings?.filter(b => b.status === "pending").length ?? 0;
  const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_amount ?? 0), 0) ?? 0;

  const typeBreakdown = (properties ?? []).reduce((acc, p) => {
    acc[p.property_type] = (acc[p.property_type] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusBreakdown = (properties ?? []).reduce((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const typeLabels: Record<string, string> = {
    hostel: "Hostel",
    apartment: "Apartment",
    shared_house: "Shared House",
    single_room: "Single Room",
    self_contained: "Self Contained",
    studio: "Studio",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Platform performance and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Occupancy Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {availableRooms} of {totalRooms} rooms available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {confirmedBookings} confirmed bookings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {publishedProperties} published
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Property Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(typeBreakdown).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{typeLabels[type] ?? type.replace(/_/g, " ")}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${totalProperties > 0 ? (count / totalProperties) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
              {Object.keys(typeBreakdown).length === 0 && (
                <p className="text-sm text-muted-foreground">No properties yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{status}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-32 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${totalProperties > 0 ? (count / totalProperties) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
              {Object.keys(statusBreakdown).length === 0 && (
                <p className="text-sm text-muted-foreground">No properties yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Total Bookings</p>
              <p className="text-2xl font-bold mt-1">{totalBookings}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Confirmed</p>
              <p className="text-2xl font-bold mt-1 text-success">{confirmedBookings}</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold mt-1 text-amber">{pendingBookings}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
