import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ms.Rent — Rental Motor Praktis, Nyaman, dan Terpercaya",
  description: "Layanan sewa motor harian dan mingguan dengan unit baru & terawat (NMAX, PCX, Vario, Scoopy, Vespa). Gratis 2 helm SNI, jas hujan, dan layanan antar jemput ke hotel & stasiun.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}
