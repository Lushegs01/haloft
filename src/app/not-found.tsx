import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search, ArrowLeft } from "lucide-react";
import { DEFAULT_CAMPUS_SLUG } from "@/lib/constants";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-12">
        <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
          <span className="text-white font-bold text-sm" style={{ fontFamily: "var(--font-inter)" }}>H</span>
        </div>
        <span
          className="text-xl font-bold text-foreground"
          style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}
        >
          Haloft
        </span>
      </Link>

      {/* 404 number */}
      <div className="relative mb-6">
        <p
          className="text-[120px] sm:text-[160px] font-extrabold leading-none select-none"
          style={{
            fontFamily: "var(--font-inter)",
            background: "linear-gradient(135deg, hsl(var(--primary)/0.15) 0%, hsl(var(--primary)/0.05) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Search className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      <h1
        className="text-2xl sm:text-3xl font-extrabold text-foreground mb-3"
        style={{ fontFamily: "var(--font-inter)", letterSpacing: "-0.03em" }}
      >
        Page not found
      </h1>
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you back to finding great accommodation.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/">
          <Button className="gap-2 rounded-full px-6 shadow-md shadow-primary/20">
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </Link>
        <Link href={`/${DEFAULT_CAMPUS_SLUG}/search`}>
          <Button variant="outline" className="gap-2 rounded-full px-6">
            <Search className="h-4 w-4" />
            Browse Listings
          </Button>
        </Link>
      </div>

      <Link
        href="javascript:history.back()"
        className="mt-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Go back
      </Link>
    </div>
  );
}
