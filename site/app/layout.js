import "./globals.css";
import { Cormorant_Garamond, Space_Grotesk } from "next/font/google";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://paradoxes-atlas.netlify.app").replace(/\/$/, "");

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-serif",
});

const sans = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Paradoxes Atlas — 267 paradoxes across logic, math & philosophy",
    template: "%s",
  },
  description:
    "Explore 267 paradoxes across logic, mathematics, probability, physics, philosophy, and decision theory — each with a sharp summary and a structured deep dive.",
  keywords: [
    "paradoxes",
    "logic",
    "mathematics",
    "philosophy",
    "decision theory",
    "probability",
    "veridical",
    "falsidical",
    "antinomy",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Paradoxes Atlas",
    description:
      "A catalog of 267 paradoxes with sharp summaries and structured deep dives.",
    url: SITE_URL,
    siteName: "Paradoxes Atlas",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Paradoxes Atlas",
    description: "A catalog of 267 paradoxes with sharp summaries and deep dives.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}

