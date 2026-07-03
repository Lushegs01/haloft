import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Haloft — Trusted Student Accommodation",
    template: "%s | Haloft",
  },
  description:
    "Haloft is the trusted accommodation marketplace for university students. Verified listings, transparent pricing, and a seamless booking experience.",
  keywords: [
    "student housing",
    "university accommodation",
    "student rooms",
    "campus housing",
    "student rentals",
    "Haloft",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Haloft",
    title: "Haloft — Trusted Student Accommodation",
    description:
      "Haloft is the trusted accommodation marketplace for university students. Verified listings, transparent pricing, and a seamless booking experience.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Haloft — Trusted Student Accommodation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Haloft — Trusted Student Accommodation",
    description:
      "Haloft is the trusted accommodation marketplace for university students. Verified listings, transparent pricing, and a seamless booking experience.",
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
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://haloft.com"
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
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
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
