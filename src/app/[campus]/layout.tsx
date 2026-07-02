import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ campus: string }> }) {
  const { campus } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("campuses")
    .select("name, universities(name)")
    .eq("slug", campus)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (!data) return { title: "Campus Not Found" };

  return {
    title: `Student Accommodation at ${data.name} — ${data.universities.name}`,
    description: `Find verified student accommodation near ${data.name}. Browse hostels, apartments, and shared housing with transparent pricing.`,
  };
}

export default async function CampusLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ campus: string }>;
}) {
  const { campus } = await params;
  const supabase = await createClient();

  const { data: campusData } = await supabase
    .from("campuses")
    .select("name, slug, university_id")
    .eq("slug", campus)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (!campusData) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-col">
      <Header campusSlug={campusData.slug} campusName={campusData.name} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
