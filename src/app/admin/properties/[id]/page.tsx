import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PropertyForm } from "../property-form";

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    redirect("/");
  }

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!property) notFound();

  const { data: campuses } = await supabase
    .from("campuses")
    .select("*")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("name");

  const { data: neighbourhoods } = await supabase
    .from("neighbourhoods")
    .select("*")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("name");

  const { data: landlords } = await supabase
    .from("landlords")
    .select("*")
    .order("full_name");

  return (
    <PropertyForm
      property={property}
      campuses={campuses ?? []}
      neighbourhoods={neighbourhoods ?? []}
      landlords={landlords ?? []}
    />
  );
}
