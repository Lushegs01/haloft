import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Users, FileText, TrendingUp, DollarSign, Building2 } from "lucide-react";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { data: properties } = await supabase
    .from("properties")
    .select("status, total_rooms, available_rooms", { count: "exact" })
    .is("deleted_at", null);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("status", { count: "exact" })
    .is("deleted_at", null);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("role", { count: "exact" })
    .eq("role", "student")
    .is("deleted_at", null);

  const totalProperties = properties?.length ?? 0;
  const publishedProperties = properties?.filter(p => p.status === "published").length ?? 0;
  const totalRooms = properties?.reduce((sum, p) => sum + (p.total_rooms ?? 0), 0) ?? 0;
  const availableRooms = properties?.reduce((sum, p) => sum + (p.available_rooms ?? 0), 0) ?? 0;
  const totalBookings = bookings?.length ?? 0;
  const pendingBookings = bookings?.filter(b => b.status === "pending").length ?? 0;
  const totalStudents = profiles?.length ?? 0;

  const stats = [
    {
      title: "Total Properties",
      value: totalProperties,
      subtitle: `${publishedProperties} published`,
      icon: Home,
      trend: "+0%",
    },
    {
      title: "Total Rooms",
      value: totalRooms,
      subtitle: `${availableRooms} available`,
      icon: Building2,
      trend: "+0%",
    },
    {
      title: "Total Bookings",
      value: totalBookings,
      subtitle: `${pendingBookings} pending`,
      icon: FileText,
      trend: "+0%",
    },
    {
      title: "Students",
      value: totalStudents,
      subtitle: "Active accounts",
      icon: Users,
      trend: "+0%",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest booking activity</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No recent bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
