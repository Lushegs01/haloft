"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, RotateCw, AlertTriangle } from "lucide-react";
import { HaloftLogo } from "@/components/ui/logo";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the browser console and server logs; hook up Sentry here later.
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      <Link href="/" className="mb-12">
        <HaloftLogo size={30} />
      </Link>

      <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>

      <h1
        className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3"
        style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}
      >
        Something went wrong
      </h1>
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        An unexpected error occurred. You can try again, or head back home while we look into it.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={reset} className="gap-2 rounded-full px-6 shadow-md shadow-primary/20">
          <RotateCw className="h-4 w-4" />
          Try again
        </Button>
        <Link href="/">
          <Button variant="outline" className="gap-2 rounded-full px-6">
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </Link>
      </div>

      {error.digest && (
        <p className="mt-8 text-xs text-muted-foreground/70">Error reference: {error.digest}</p>
      )}
    </div>
  );
}
