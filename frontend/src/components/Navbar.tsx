"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

interface NavbarProps {
  onOpenCheckBooking: () => void;
}

export default function Navbar({ onOpenCheckBooking }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-base/90 border-b border-sand-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Mark */}
        <Link href="/" className="flex items-baseline space-x-2 group">
          <span className="font-serif text-2xl sm:text-3xl text-ink tracking-tight">
            ms<span className="text-rust">.</span>rent
          </span>
          <span className="hidden sm:inline-block text-[11px] font-sans font-medium text-ink-muted/80 tracking-wide pl-2 border-l border-sand-200">
            Garasi Motor Urban Jabodetabek
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-ink-muted">
          <Link href="#armada" className="hover:text-ink transition-colors">
            Katalog Armada
          </Link>
          <Link href="#standar-garasi" className="hover:text-ink transition-colors">
            Standar Perawatan
          </Link>
          <Link href="#ketentuan" className="hover:text-ink transition-colors">
            Ketentuan & Tarif
          </Link>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center space-x-3">
          <button
            onClick={onOpenCheckBooking}
            className="text-xs font-medium text-ink px-4 py-2.5 rounded-lg border border-sand-200 bg-sand-50 hover:bg-sand-100 hover:border-sand-300 transition-all shadow-warm-sm"
          >
            Lacak Reservasi
          </button>
          <Link
            href="/admin"
            className="text-xs font-medium text-ink-muted hover:text-ink px-2.5 py-2 transition-colors"
          >
            Admin
          </Link>
          <a
            href="https://wa.me/6281234567890?text=Halo%20ms.Rent,%20saya%20ingin%20tanya%20sewa%20motor"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium px-4 py-2.5 rounded-lg bg-rust hover:bg-rust-hover text-white transition-all shadow-warm-sm"
          >
            Hubungi Garasi
          </a>
        </div>

        {/* Mobile Hamburger */}
        <div className="flex md:hidden items-center space-x-2">
          <button
            onClick={onOpenCheckBooking}
            className="text-xs font-medium text-ink px-3 py-1.5 rounded-lg border border-sand-200 bg-sand-50"
          >
            Lacak
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-ink hover:bg-sand-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-sand-200 bg-base px-5 py-5 space-y-4">
          <div className="flex flex-col space-y-3 text-sm font-medium text-ink">
            <Link
              href="#armada"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-rust"
            >
              Katalog Armada
            </Link>
            <Link
              href="#standar-garasi"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-rust"
            >
              Standar Perawatan
            </Link>
            <Link
              href="#ketentuan"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-rust"
            >
              Ketentuan & Tarif
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-ink-muted hover:text-ink"
            >
              Dashboard Admin
            </Link>
          </div>
          <div className="pt-3 border-t border-sand-200 flex flex-col space-y-2">
            <a
              href="https://wa.me/6281234567890?text=Halo%20ms.Rent,%20saya%20ingin%20tanya%20sewa%20motor"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center text-xs font-semibold py-2.5 rounded-lg bg-rust text-white"
            >
              WhatsApp Garasi (0812-3456-7890)
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
