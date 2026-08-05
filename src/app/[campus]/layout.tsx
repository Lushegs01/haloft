import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HomeOnlyFooter } from "@/components/layout/home-only-footer";
import { getActiveCampuses, getCampusBySlug } from "@/lib/data/campus";
import { notFound } from "next/navigation";

/** Campuses are data, so the set is small and known at build time. */
export async function generateStaticParams() {
  try {
    const campuses = await getActiveCampuses();
    return campuses.map((c) => ({ campus: c.slug }));
  } catch {
    // No database reachable during the build — fall back to rendering on
    // demand rather than failing the build.
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ campus: string }> }) {
  const { campus } = await params;
  const data = await getCampusBySlug(campus);

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
  const campusData = await getCampusBySlug(campus);

  if (!campusData) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-col">
      <Header campusSlug={campusData.slug} campusName={campusData.name} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <HomeOnlyFooter campusSlug={campusData.slug}>
        <Footer campusSlug={campusData.slug} />
      </HomeOnlyFooter>
    </div>
  );
}
