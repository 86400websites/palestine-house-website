import type { Metadata } from "next";
import { Inter, Spectral } from "next/font/google";
import { Providers } from "@/app/providers";
import { SiteChrome } from "@/components/layout/site-chrome";
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
          {/* Public chrome on marketing/auth routes; gated routes (the
              (workspace) group + /admin) bring their own shell — see SiteChrome
              (GATED_PREFIXES). */}
          <SiteChrome header={<SiteHeader />} footer={<SiteFooter />}>
            {children}
          </SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
