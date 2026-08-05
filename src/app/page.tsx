import { Navbar } from "@/components/haloft/navbar";
import { Hero } from "@/components/haloft/hero";
import { TrustStrip } from "@/components/haloft/trust-strip";
import { ProblemStory } from "@/components/haloft/problem-story";
import { PropertyGallery } from "@/components/haloft/property-gallery";
import { UniversityDiscovery } from "@/components/haloft/university-discovery";
import { HowItWorks } from "@/components/haloft/how-it-works";
import { ProductShowcase } from "@/components/haloft/product-showcase";
import { TrustSection } from "@/components/haloft/trust-section";
import { StudentFilters } from "@/components/haloft/student-filters";
import { OwnerSection } from "@/components/haloft/owner-section";
import { Principles } from "@/components/haloft/principles";
import { FinalCta } from "@/components/haloft/final-cta";
import { Footer } from "@/components/layout/footer";
import { DEFAULT_CAMPUS_SLUG } from "@/lib/constants";
import { getLandingData } from "@/data/marketplace";

export default async function LandingPage() {
  const { universities, listings } = await getLandingData();

  // The hero is anchored by whichever home has a photograph; failing
  // that, by the first card in the set.
  const featured =
    listings.listings.find((l) => l.imageUrl) ?? listings.listings[0];

  const campusSlug =
    universities.universities.find((u) => u.status === "live")?.slug ??
    DEFAULT_CAMPUS_SLUG;

  return (
    <>
      <Navbar />
      <main id="main" className="flex-1">
        <Hero universities={universities.universities} featured={featured} />
        <TrustStrip />
        <ProblemStory />
        <PropertyGallery
          listings={listings.listings}
          source={listings.source}
          campusSlug={campusSlug}
        />
        <UniversityDiscovery
          universities={universities.universities}
          source={universities.source}
        />
        <HowItWorks />
        <ProductShowcase />
        <TrustSection />
        <StudentFilters campusSlug={campusSlug} />
        <OwnerSection />
        <Principles />
        <FinalCta campusSlug={campusSlug} />
      </main>
      <Footer campusSlug={campusSlug} />
    </>
  );
}
