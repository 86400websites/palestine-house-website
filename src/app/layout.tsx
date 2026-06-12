import type { Metadata } from "next";
import { Inter, Spectral } from "next/font/google";
import { Providers } from "@/app/providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import "@/styles/globals.css";

/* Brand faces (DESIGN.md §4) — Spectral for display, Inter for body/UI.
   Only the weights the design-system type scale uses. */
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_TAGLINE,
  alternates: {
    /* Resolves to each route's own path against metadataBase. */
    canonical: "./",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
  },
};

/* JSON-LD: Organization + WebSite (TECH-ARCHITECTURE §14). */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_TAGLINE,
    },
    {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spectral.variable} ${inter.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Providers>
          <div className="ph-page">
            <a className="ph-skip-link" href="#main-content">
              Skip to content
            </a>
            <SiteHeader />
            {/* tabIndex moves focus (not just scroll) when the skip link fires */}
            <main id="main-content" tabIndex={-1}>
              {children}
            </main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
