import type { Metadata } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Display face — headlines, prices, the logo wordmark
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Haloft — Find Trusted Student Accommodation Near Your University",
    template: "%s | Haloft",
  },
  description:
    "Haloft is the trusted accommodation marketplace for Nigerian university students. Verified listings, transparent pricing, walk-times to campus, and secure payments through Paystack.",
  keywords: [
    "student housing",
    "university accommodation",
    "student rooms",
    "campus housing",
    "student rentals",
    "hostels in Nigeria",
    "self contained near campus",
    "Haloft",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Haloft",
    title: "Haloft — Find Trusted Student Accommodation Near Your University",
    description:
      "Haloft is the trusted accommodation marketplace for Nigerian university students. Verified listings, transparent pricing, walk-times to campus, and secure payments through Paystack.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Haloft — Find Trusted Student Accommodation Near Your University",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Haloft — Find Trusted Student Accommodation Near Your University",
    description:
      "Haloft is the trusted accommodation marketplace for Nigerian university students. Verified listings, transparent pricing, and secure payments.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.haloft.homes"
  ),
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${bricolage.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              borderRadius: "12px",
              border: "1px solid var(--border)",
              boxShadow: "0 8px 32px rgb(0 0 0 / 0.12)",
            },
          }}
        />
      </body>
    </html>
  );
}
