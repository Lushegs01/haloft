import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4">
      <Building2 className="h-16 w-16 text-muted-foreground/30 mb-6" />
      <h1 className="text-4xl font-bold tracking-tight mb-2">404</h1>
      <p className="text-lg text-muted-foreground mb-8">Page not found</p>
      <Link href="/">
        <Button className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>
      </Link>
    </div>
  );
}
