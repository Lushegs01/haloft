import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Search, Plus, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";

export default async function AdminInspectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  let query = supabase
    .from("inspections")
    .select("*, properties(title, slug), profiles(full_name)")
    .is("deleted_at", null)
    .order("scheduled_date", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status as "scheduled" | "completed" | "cancelled" | "no_show");
  }

  const { data: inspections } = await query;

  const statusColors: Record<string, string> = {
    scheduled: "bg-info/10 text-info border-info/20",
    completed: "bg-success/10 text-success border-success/20",
    cancelled: "bg-muted text-muted-foreground border-border",
    no_show: "bg-amber/10 text-amber border-amber/20",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inspections</h1>
          <p className="text-muted-foreground">Schedule and track property inspections</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              {["scheduled", "completed", "cancelled", "no_show"].map((status) => (
                <Link key={status} href={`/admin/inspections?status=${status}`}>
                  <Badge variant={params.status === status ? "default" : "outline"} className="cursor-pointer capitalize">
                    {status.replace("_", " ")}
                  </Badge>
                </Link>
              ))}
              {params.status && (
                <Link href="/admin/inspections">
                  <Badge variant="outline" className="cursor-pointer">All</Badge>
                </Link>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {inspections && inspections.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Property</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Inspector</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Scheduled</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rating</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Findings</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.map((inspection) => (
                    <tr key={inspection.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{inspection.properties?.title ?? "N/A"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{inspection.profiles?.full_name ?? "N/A"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={statusColors[inspection.status] ?? ""}>
                          {inspection.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm">
                          {new Date(inspection.scheduled_date).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        {inspection.rating ? (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">{inspection.rating}</span>
                            <span className="text-muted-foreground">/5</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm line-clamp-2">{inspection.findings ?? "-"}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <Shield className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No inspections found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
