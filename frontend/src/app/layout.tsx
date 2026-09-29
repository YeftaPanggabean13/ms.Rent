import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ms.Rent — Rental Motor Urban & Terawat di Bandung",
  description: "Layanan sewa motor harian dan mingguan berkelas untuk komuter urban dan penikmat roda dua di Bandung (Beat, Scoopy, Aerox). Lengkap dengan 2 helm SNI, jas hujan higienis, dan antar-jemput Lokasi Mu!.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body className="min-h-screen bg-base text-ink font-sans selection:bg-rust selection:text-white">
        {children}
      </body>
    </html>
  );
}
