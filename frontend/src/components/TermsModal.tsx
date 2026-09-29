"use client";

import { X } from "lucide-react";
import TermsAccordion from "@/components/TermsAccordion";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex p-4 sm:p-6 bg-ink/50 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl m-auto flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] bg-white border border-sand-200 rounded-2xl shadow-warm-xl overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-sand-200 bg-sand-50/50 shrink-0">
          <div>
            <span className="text-xs font-semibold text-rust tracking-wide">ms.Rent</span>
            <h2 className="font-serif text-xl font-bold text-ink mt-0.5">Ketentuan &amp; Syarat Rental</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-sand-200 transition"
            aria-label="Tutup ketentuan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto min-h-0">
          <TermsAccordion />
        </div>

        <div className="p-5 border-t border-sand-200 bg-sand-50/50 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-rust hover:bg-rust-hover text-white font-medium text-xs transition shadow-warm-sm"
          >
            Mengerti &amp; Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
