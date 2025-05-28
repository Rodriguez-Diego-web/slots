import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from '@/components/Header'; 
import Footer from '@/components/Footer'; 
import { AuthProvider } from '@/contexts/AuthContext';
import StructuredData from "./structured-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CUXSNACK Slot Machine | Gewinne echte Snack-Preise",
  description: "Drehe die Walzen bei der CUXSNACK Slot Machine und gewinne tolle Snack-Preise wie Takis, Doritos, Calypso oder den 100€ Jackpot! Kostenlos spielen und echte Gewinne erhalten.",
  keywords: ["slot machine", "spielautomat", "gewinnspiel", "snacks", "cuxsnack", "cuxhaven", "online slot", "jackpot", "kostenlos spielen"],
  authors: [{ name: "Diego Rodriguez" }],
  creator: "CUXSNACK",
  publisher: "CUXSNACK",
  metadataBase: new URL("https://cuxsnack.de"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "CUXSNACK Slot Machine | Drehe & Gewinne",
    description: "Spiele jetzt die CUXSNACK Slot Machine und gewinne echte Preise! Kostenlos, ohne Einsatz, mit echten Gewinnen.",
    url: "https://cuxsnack.de",
    siteName: "CUXSNACK Slot Machine",
    images: [{
      url: "/og-image.jpg",
      width: 1200,
      height: 630,
      alt: "CUXSNACK Slot Machine Preview",
    }],
    locale: "de_DE",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    google: "fwAOYgQCy1Fc2EEaRZn_ziXtHdPAPh5M_Q6F-jBDoUY",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <head>
        <meta name="google-site-verification" content="fwAOYgQCy1Fc2EEaRZn_ziXtHdPAPh5M_Q6F-jBDoUY" />
        <StructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white flex flex-col min-h-screen`}
      >
        <AuthProvider>
          <Header />
          {/* Added px-4 for horizontal safety margin. Main area is still full-width for background purposes. */}
          <main className="flex-grow px-4 pt-20 pb-24">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
