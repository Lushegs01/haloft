import { createClient } from "@/lib/supabase/server";
import { sanitizeSearchTerm } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Home, Plus, Search, Building2, MapPin, Pencil, Eye } from "lucide-react";

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  let query = supabase
    .from("properties")
    .select("*, campuses(name, slug), neighbourhoods(name)")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const q = params.q ? sanitizeSearchTerm(params.q) : "";
  if (q) {
    query = query.or(`title.ilike.%${q}%,address.ilike.%${q}%`);
  }
  if (params.status) {
    const validStatuses = ["draft", "published", "unpublished", "archived"] as const;
    if ((validStatuses as readonly string[]).includes(params.status)) {
      query = query.eq("status", params.status as "draft" | "published" | "unpublished" | "archived");
    }
  }

  const { data: properties } = await query;

  const statusColors: Record<string, string> = {
    draft: "bg-amber/10 text-amber border-amber/20",
    published: "bg-success/10 text-success border-success/20",
    unpublished: "bg-muted text-muted-foreground border-border",
    archived: "bg-slate/10 text-slate border-slate/20",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Properties</h1>
          <p className="text-muted-foreground">Manage all properties across campuses</p>
        </div>
        <Link href="/admin/properties/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Property
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <form className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input name="q" placeholder="Search properties..." className="pl-10" defaultValue={params.q} />
            </form>
            <div className="flex gap-2">
              {["draft", "published", "unpublished", "archived"].map((status) => (
                <Link
                  key={status}
                  href={`/admin/properties?status=${status}${params.q ? `&q=${params.q}` : ""}`}
                >
                  <Badge
                    variant={params.status === status ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                  >
                    {status}
                  </Badge>
                </Link>
              ))}
              {params.status && (
                <Link href={`/admin/properties${params.q ? `?q=${params.q}` : ""}`}>
                  <Badge variant="outline" className="cursor-pointer">All</Badge>
                </Link>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {properties && properties.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Property</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Campus</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Rooms</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map((property) => (
                    <tr key={property.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Home className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{property.title}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {property.address}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{property.campuses?.name ?? "N/A"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={statusColors[property.status] ?? ""}>
                          {property.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm">
                          {property.available_rooms} / {property.total_rooms}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium">
                          ₦{property.min_price?.toLocaleString() ?? "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/properties/${property.id}`}>
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                          </Link>
                          <Link href={`/${property.campuses?.slug}/property/${property.slug}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Building2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No properties found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
