import type { Metadata, Viewport } from "next";
import { Orbitron, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "600", "700", "900"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Snake & Ladder — 3D Multiplayer",
  description: "Play the classic Snake and Ladder in stunning 3D — solo or with friends online.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Snake & Ladder" },
  openGraph: {
    title: "Snake & Ladder — 3D Multiplayer",
    description: "Play the classic Snake and Ladder in stunning 3D",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#030305",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${orbitron.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-grid min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
