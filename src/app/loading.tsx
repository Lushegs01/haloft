import { Suspense } from "react";

export default function Loading() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center p-8">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
    </div>
  );
}
