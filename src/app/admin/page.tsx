import { createClient } from "@/lib/supabase/server";
import {
  Home,
  Users,
  FileText,
  Building2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
  CheckCircle2,
} from "lucide-react";

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
  const publishedProperties =
    properties?.filter((p) => p.status === "published").length ?? 0;
  const totalRooms =
    properties?.reduce((sum, p) => sum + (p.total_rooms ?? 0), 0) ?? 0;
  const availableRooms =
    properties?.reduce((sum, p) => sum + (p.available_rooms ?? 0), 0) ?? 0;
  const totalBookings = bookings?.length ?? 0;
  const pendingBookings =
    bookings?.filter((b) => b.status === "pending").length ?? 0;
  const confirmedBookings =
    bookings?.filter((b) => b.status === "confirmed").length ?? 0;
  const totalStudents = profiles?.length ?? 0;

  const occupancyRate =
    totalRooms > 0
      ? Math.round(((totalRooms - availableRooms) / totalRooms) * 100)
      : 0;

  const stats = [
    {
      title: "Total Properties",
      value: totalProperties,
      subtitle: `${publishedProperties} published`,
      icon: Home,
      color: "text-primary",
      bg: "bg-primary/10",
      trend: publishedProperties > 0 ? "up" : "neutral",
    },
    {
      title: "Total Rooms",
      value: totalRooms,
      subtitle: `${availableRooms} available`,
      icon: Building2,
      color: "text-info",
      bg: "bg-info/10",
      trend: availableRooms > 0 ? "up" : "down",
    },
    {
      title: "Total Bookings",
      value: totalBookings,
      subtitle: `${pendingBookings} pending review`,
      icon: FileText,
      color: "text-amber",
      bg: "bg-amber/10",
      trend: confirmedBookings > 0 ? "up" : "neutral",
    },
    {
      title: "Students",
      value: totalStudents,
      subtitle: "Active accounts",
      icon: Users,
      color: "text-success",
      bg: "bg-success/10",
      trend: totalStudents > 0 ? "up" : "neutral",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">

      {/* Header */}
      <div>
        <h1
          className="text-3xl font-extrabold text-foreground"
          style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}
        >
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Platform overview and key metrics
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`h-10 w-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${
                stat.trend === "up" ? "text-success" : stat.trend === "down" ? "text-destructive" : "text-muted-foreground"
              }`}>
                {stat.trend === "up" ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : stat.trend === "down" ? (
                  <TrendingDown className="h-3.5 w-3.5" />
                ) : null}
              </div>
            </div>
            <p
              className="text-3xl font-bold text-foreground mb-1"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {stat.value}
            </p>
            <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Occupancy + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Occupancy card */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2
              className="font-bold text-foreground"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Room Occupancy
            </h2>
            <span className="text-2xl font-extrabold text-primary" style={{ fontFamily: "var(--font-inter)" }}>
              {occupancyRate}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-orange-500 transition-all"
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
          <div className="flex justify-between mt-3 text-xs text-muted-foreground">
            <span>{totalRooms - availableRooms} occupied</span>
            <span>{availableRooms} available</span>
          </div>
        </div>

        {/* Booking status */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2
            className="font-bold text-foreground mb-5"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Booking Status
          </h2>
          <div className="space-y-3">
            {[
              {
                label: "Pending review",
                value: pendingBookings,
                color: "bg-amber",
                icon: <Clock className="h-3.5 w-3.5 text-amber" />,
              },
              {
                label: "Confirmed",
                value: confirmedBookings,
                color: "bg-success",
                icon: <CheckCircle2 className="h-3.5 w-3.5 text-success" />,
              },
              {
                label: "Total bookings",
                value: totalBookings,
                color: "bg-primary",
                icon: <FileText className="h-3.5 w-3.5 text-primary" />,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-bold text-foreground">{item.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{
                        width: totalBookings > 0 ? `${(item.value / totalBookings) * 100}%` : "0%",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2
          className="font-bold text-foreground mb-4"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Property", href: "/admin/properties", icon: Home },
            { label: "View Bookings", href: "/admin/bookings", icon: FileText },
            { label: "Manage Rooms", href: "/admin/rooms", icon: Building2 },
            { label: "View Analytics", href: "/admin/analytics", icon: ArrowUpRight },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/30 p-4 text-center hover:bg-muted hover:border-primary/30 transition-all group"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
