import type { Metadata } from "next";
import { Alexandria, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WalletProvider } from "@/contexts/WalletContext";

const alexandria = Alexandria({
  variable: "--font-alexandria",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cyclespace — Institutional Trading",
  description: "High-velocity decentralized finance with institutional-grade tooling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${alexandria.variable} ${geistMono.variable} h-full font-sans antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider><WalletProvider>{children}</WalletProvider></ThemeProvider>
      </body>
    </html>
  );
}
