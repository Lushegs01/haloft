import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a dummy client that fails gracefully when env vars are missing
    // (e.g. during static build / prerender)
    return createBrowserClient<Database>(
      "http://localhost:54321",
      "dummy-key-for-build"
    );
  }

  return createBrowserClient<Database>(url, key);
}
