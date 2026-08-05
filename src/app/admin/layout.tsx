import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  Building2,
  LayoutDashboard,
  Home,
  Users,
  FileText,
  Shield,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { HaloftLogoDark } from "@/components/ui/logo";
import { AppToaster } from "@/components/ui/app-toaster";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/properties", icon: Home, label: "Properties" },
  { href: "/admin/rooms", icon: Building2, label: "Rooms" },
  { href: "/admin/bookings", icon: FileText, label: "Bookings" },
  { href: "/admin/inspections", icon: Shield, label: "Inspections" },
  { href: "/admin/reviews", icon: Users, label: "Reviews" },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    redirect("/");
  }

  const initial = (profile.full_name?.[0] ?? user.email?.[0] ?? "A").toUpperCase();

  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      <AppToaster />

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="w-64 bg-sidebar flex flex-col shrink-0 border-r border-sidebar-border">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Link href="/" className="flex items-center gap-2.5 group">
            <HaloftLogoDark size={30} />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
            </Link>
          ))}
        </nav>

        {/* User + Sign out */}
        <div className="px-3 py-4 border-t border-sidebar-border space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-sidebar-foreground truncate">
                {profile.full_name ?? "Admin"}
              </p>
              <p className="text-[10px] text-sidebar-foreground/40 capitalize">
                {profile.role}
              </p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-full">
          {/* Top bar */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-8 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Haloft Admin Panel
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-success" />
                All systems operational
              </div>
            </div>
          </div>

          <div className="px-8 py-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
