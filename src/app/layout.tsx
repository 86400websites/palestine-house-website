import type { Metadata } from "next";
import { Inter, Spectral } from "next/font/google";
import { Providers } from "@/app/providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
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
  title: {
    default: "Palestine House",
    template: "%s · Palestine House",
  },
  description: "A fixed address for Palestinian culture, in every city.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${spectral.variable} ${inter.variable}`}>
      <body>
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
