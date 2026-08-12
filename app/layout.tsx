import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import "./globals.css";

// Cal Sans — the display voice: wordmark and card titles.
const calSans = localFont({
  src: "./fonts/CalSans-SemiBold.woff2",
  variable: "--font-cal",
  weight: "600",
  display: "swap",
});

// Inter — UI and every number.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Finora — plan your money",
  description:
    "Income, spending, budgets, goals and a live USD→INR converter. Everything stays in your browser — nothing leaves your device.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${calSans.variable} ${inter.variable}`}>
      <body className="bg-page font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
