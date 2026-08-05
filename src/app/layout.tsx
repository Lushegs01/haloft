import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import "./globals.css";

/* Primary voice — a precise, contemporary grotesque. Everything in the
   product is set in this face; hierarchy comes from size, weight and
   tracking rather than from a second UI font. */
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

/* Editorial counterpoint — used for single emphasised words in display
   headlines and pull quotes. Never for UI. */
const editorial = Instrument_Serif({
  variable: "--font-editorial",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.haloft.homes";
const TITLE = "Haloft — Student housing near your university, without the chaos";
const DESCRIPTION =
  "Haloft helps Nigerian university students find rooms, self-contained apartments and hostels around campus — with clearer information, walk-times you can check, transparent pricing and fewer middlemen.";

export const metadata: Metadata = {
  title: {
    default: TITLE,
    template: "%s | Haloft",
  },
  description: DESCRIPTION,
  applicationName: "Haloft",
  keywords: [
    "student accommodation",
    "student housing Nigeria",
    "university hostels",
    "self contained near campus",
    "FUNAAB accommodation",
    "student rooms Abeokuta",
    "campus housing",
    "Haloft",
  ],
  authors: [{ name: "Haloft" }],
  openGraph: {
    type: "website",
    locale: "en_NG",
    siteName: "Haloft",
    url: "/",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Haloft — student housing near your university",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
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
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#f7f7f2",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${editorial.variable} h-full antialiased`}
    >
      <head>
        {/*
          Entrance animations hide their element until it scrolls into
          view. That hidden state is scoped to this class, set before
          first paint, so a page whose JavaScript never arrives renders
          everything visible instead of blank.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.classList.add('js-reveal')`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:inline-flex focus:h-11 focus:items-center focus:rounded-[10px] focus:bg-[var(--navy)] focus:px-4 focus:text-[14px] focus:font-medium focus:text-white"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
