import { Navbar } from "@/components/haloft/navbar";
import { Hero } from "@/components/haloft/hero";
import { TrustStrip } from "@/components/haloft/trust-strip";
import { ProblemSection } from "@/components/haloft/problem-section";
import { HowItWorks } from "@/components/haloft/how-it-works";
import { FeaturedSection } from "@/components/haloft/featured-section";
import { UniversityGrid } from "@/components/haloft/university-grid";
import { MapPreview } from "@/components/haloft/map-preview";
import { PropertyDetailPreview } from "@/components/haloft/property-detail-preview";
import { VerificationSection } from "@/components/haloft/verification-section";
import { PriceBreakdown } from "@/components/haloft/price-breakdown";
import { ComparisonTable } from "@/components/haloft/comparison-table";
import { StudentFilters } from "@/components/haloft/student-filters";
import { NoAgentsSection } from "@/components/haloft/no-agents-section";
import { OwnerDashboardPreview } from "@/components/haloft/owner-dashboard-preview";
import { CampusEcosystem } from "@/components/haloft/campus-ecosystem";
import { TestimonialsSection } from "@/components/haloft/testimonials-section";
import { FaqSection } from "@/components/haloft/faq-section";
import { FinalCta } from "@/components/haloft/final-cta";
import { LandingFooter } from "@/components/haloft/landing-footer";
import { DEFAULT_CAMPUS_SLUG } from "@/lib/constants";
import { getLandingData } from "@/data/marketplace";

export default async function LandingPage() {
  const { universities, listings } = await getLandingData();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero universities={universities.universities} />
        <TrustStrip />
        <ProblemSection />
        <HowItWorks />
        <FeaturedSection
          listings={listings.listings}
          source={listings.source}
          campusSlug={DEFAULT_CAMPUS_SLUG}
        />
        <UniversityGrid
          universities={universities.universities}
          source={universities.source}
        />
        <MapPreview />
        <PropertyDetailPreview />
        <VerificationSection />
        <PriceBreakdown />
        <ComparisonTable />
        <StudentFilters />
        <NoAgentsSection />
        <OwnerDashboardPreview />
        <CampusEcosystem />
        <TestimonialsSection />
        <FaqSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
