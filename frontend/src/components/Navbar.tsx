"use client";

import Link from "next/link";
import { useState } from "react";
import { Bike as BikeIcon, Search, ShieldCheck, PhoneCall, LayoutDashboard, Menu, X } from "lucide-react";

interface NavbarProps {
  onOpenCheckBooking: () => void;
}

export default function Navbar({ onOpenCheckBooking }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <BikeIcon className="w-7 h-7 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center">
              <span className="text-2xl font-black tracking-tight text-white">ms<span className="text-brand-500">.Rent</span></span>
              <span className="ml-2 px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded">Motor</span>
            </div>
            <span className="text-xs text-slate-400">Rental Motor Praktis & Cepat</span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="#armada" className="text-sm font-medium text-slate-300 hover:text-brand-400 transition-colors">
            Armada Motor
          </Link>
          <Link href="#keunggulan" className="text-sm font-medium text-slate-300 hover:text-brand-400 transition-colors">
            Fasilitas & Keunggulan
          </Link>
          <Link href="#faq" className="text-sm font-medium text-slate-300 hover:text-brand-400 transition-colors">
            Syarat & Ketentuan
          </Link>
          <button
            onClick={onOpenCheckBooking}
            className="flex items-center space-x-1.5 text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900/50 hover:bg-slate-800 transition-colors"
          >
            <Search className="w-4 h-4 text-brand-400" />
            <span>Cek Status Sewa</span>
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="hidden lg:flex items-center space-x-4">
          <Link
            href="/admin"
            className="flex items-center space-x-2 text-xs font-semibold px-3 py-2 rounded-lg text-slate-300 bg-slate-800/80 hover:bg-slate-700 transition"
          >
            <LayoutDashboard className="w-4 h-4 text-brand-400" />
            <span>Admin Panel</span>
          </Link>
          <a
            href="https://wa.me/6281234567890?text=Halo%20ms.Rent,%20saya%20ingin%20tanya%20sewa%20motor"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 text-white shadow-lg shadow-brand-500/25 hover:from-brand-600 hover:to-amber-600 transition"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Hubungi Kami</span>
          </a>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center space-x-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-900/95 px-4 pt-3 pb-6 space-y-3">
          <Link
            href="#armada"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            Armada Motor
          </Link>
          <Link
            href="#keunggulan"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-slate-800"
          >
            Fasilitas & Keunggulan
          </Link>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenCheckBooking();
            }}
            className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium text-brand-400 hover:bg-slate-800"
          >
            <Search className="w-4 h-4" />
            <span>Cek Status Sewa</span>
          </button>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800"
          >
            Admin Dashboard
          </Link>
          <div className="pt-2">
            <a
              href="https://wa.me/6281234567890?text=Halo%20ms.Rent,%20saya%20ingin%20tanya%20sewa%20motor"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-brand-500 text-white font-semibold shadow-md"
            >
              <PhoneCall className="w-4 h-4" />
              <span>WhatsApp Admin (0812-3456-7890)</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
