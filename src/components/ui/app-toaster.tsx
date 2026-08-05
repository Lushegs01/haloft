import { Toaster } from "@/components/ui/sonner";

/**
 * Toasts, mounted per route rather than in the root layout.
 *
 * Nothing on the public browsing path — the landing page, a campus,
 * search, a listing — ever raises a toast, so keeping the toaster in the
 * root layout shipped its JavaScript to every student who was only
 * looking at rooms. It now loads on the routes that actually use it:
 * auth, booking, the dashboard and the admin CMS.
 */
export function AppToaster() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          borderRadius: "14px",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-lifted)",
        },
      }}
    />
  );
}
