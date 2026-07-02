import { createClient } from "@/lib/supabase/server";
import { sanitizeSearchTerm } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, Search, Plus } from "lucide-react";

export default async function AdminRoomsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; property?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  let query = supabase
    .from("rooms")
    .select("*, properties(title, slug, campus_id), buildings(name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const q = params.q ? sanitizeSearchTerm(params.q) : "";
  if (q) {
    query = query.or(`name.ilike.%${q}%,properties.title.ilike.%${q}%`);
  }
  if (params.property) {
    query = query.eq("property_id", params.property);
  }

  const { data: rooms } = await query;

  const statusColors: Record<string, string> = {
    available: "bg-success/10 text-success border-success/20",
    occupied: "bg-destructive/10 text-destructive border-destructive/20",
    maintenance: "bg-amber/10 text-amber border-amber/20",
    reserved: "bg-info/10 text-info border-info/20",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rooms</h1>
          <p className="text-muted-foreground">Manage room inventory across all properties</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <form className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input name="q" placeholder="Search rooms..." className="pl-10" defaultValue={params.q} />
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {rooms && rooms.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Room</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Property</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Available</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{room.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{room.properties?.title ?? "N/A"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm capitalize">{room.room_type}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={statusColors[room.status] ?? ""}>
                          {room.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-medium">₦{room.price_per_month?.toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant={room.is_available ? "default" : "secondary"}>
                          {room.is_available ? "Yes" : "No"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No rooms found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
