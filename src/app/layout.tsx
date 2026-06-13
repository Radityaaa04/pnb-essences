import type { Metadata } from "next";
import { Cormorant_Garamond, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/layout/SmoothScroll";
import SceneWrapper from "@/components/canvas/SceneWrapper";
import CustomCursor from "@/components/ui/CustomCursor";
import Preloader from "@/components/ui/Preloader";

// Cormorant Garamond: ultra-sharp hairline serifs, ultra-high contrast — the
// signature of Bottega Veneta, Loewe, and high-end fragrance maisons.
const cormorant = Cormorant_Garamond({
  variable: "--font-playfair", // keep same var name so page.tsx needs no change
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PNB Essences | The Laboratory",
  description: "Stealth. Precision. Craftsmanship. A private fragrance laboratory crafting limited-edition perfumes for the discerning.",
  openGraph: {
    title: "PNB Essences | The Laboratory",
    description: "Stealth. Precision. Craftsmanship.",
    url: "https://pnbessences.com",
    siteName: "PNB Essences",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PNB Essences | The Laboratory",
    description: "Stealth. Precision. Craftsmanship.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

import AudioController from "@/components/ui/AudioController";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-[#030303] text-[#eaeaea]">
        <AudioController />
        <Preloader />
        <CustomCursor />
        <SmoothScroll>
          <div className="fixed inset-0 z-50 pointer-events-none opacity-[0.04] mix-blend-difference film-grain"></div>
          <SceneWrapper />
          <div className="relative z-10">{children}</div>
        </SmoothScroll>
      </body>
    </html>
  );
}
