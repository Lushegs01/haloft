import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { SUPABASE_CONFIG_HINT, isSupabaseConfigured } from "./config";

export { isSupabaseConfigured };

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Returning a client (rather than throwing) keeps prerender and the
    // read paths that swallow query errors working. Every request it makes
    // still fails — callers that talk to a user must check
    // isSupabaseConfigured() first so the failure is explainable.
    if (typeof window !== "undefined") {
      console.error(SUPABASE_CONFIG_HINT);
    }
    return createBrowserClient<Database>(
      "http://localhost:54321",
      "dummy-key-for-build"
    );
  }

  return createBrowserClient<Database>(url, key);
}
