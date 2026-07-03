import { createClient } from "@/lib/supabase/server";

/**
 * Returns the signed-in user only if they hold an admin or super_admin
 * role, otherwise null. Server-side gate for admin server actions —
 * complements the RLS policies (migration 003) as defense in depth.
 */
export async function getAdminUser(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "super_admin")) {
    return null;
  }

  return user;
}
