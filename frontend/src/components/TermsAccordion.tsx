"use client";

import { useState, ReactNode } from "react";
import { FileText, Wallet, Clock, Plus, Minus, Check } from "lucide-react";

export const TERMS: { q: string; a: ReactNode; icon: typeof FileText }[] = [
  {
    q: "Dokumen apa saja yang diperlukan untuk menyewa motor?",
    a: (
      <>
        Penyewa wajib memiliki <strong>SIM C aktif</strong> dan menitipkan 2 identitas asli sebagai jaminan
        (misal: e-KTP dan SIM A / NPWP / Kartu BPJS / Kartu Karyawan / Paspor).
      </>
    ),
    icon: FileText,
  },
  {
    q: "Bagaimana metode pembayaran yang didukung?",
    a: (
      <>
        Pembayaran dapat dilakukan melalui transfer bank (BCA, Mandiri, BRI) atau QRIS resmi setelah pemesanan
        dikonfirmasi oleh admin garasi kami.
      </>
    ),
    icon: Wallet,
  },
  {
    q: "Berapa jam hitungan 1 hari sewa?",
    a: (
      <>
        Sewa 1 hari dihitung 24 jam penuh sejak jam serah terima unit motor kepada penyewa. Keterlambatan
        pengembalian hingga 60 menit dibebaskan dari biaya denda.
      </>
    ),
    icon: Clock,
  },
  {
    q: "Bisa sewa motor per jam?",
    a: (
      <>
        Bisa. Pilih tipe <strong>Per Jam</strong> saat reservasi dengan durasi minimal <strong>2 jam</strong> dan
        maksimal <strong>23 jam</strong> (boleh melewati tengah malam). Tarifnya dihitung per jam sesuai unit —
        berbeda dari tarif harian. Untuk durasi 24 jam ke atas, gunakan sewa harian agar lebih hemat.
      </>
    ),
    icon: Clock,
  },
  {
    q: "Bagaimana cara memperpanjang sewa (tambah jam)?",
    a: (
      <>
        Buka <strong>Lacak Reservasi</strong> dengan kode booking Anda, lalu tekan <strong>Perpanjang Sewa</strong>,
        pilih jumlah jam tambahan, dan masukkan No. WhatsApp saat reservasi. Permintaan berlaku setelah disetujui
        garasi. Biaya tambahan (tarif per jam x jumlah jam) langsung ditambahkan ke total tagihan; bila sebelumnya
        sudah lunas, status pembayaran kembali menjadi belum lunas untuk sisa tagihannya.
      </>
    ),
    icon: Plus,
  },
];

interface TermsAccordionProps {
  className?: string;
}

export default function TermsAccordion({ className = "" }: TermsAccordionProps) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);
  const allOpen = openIndexes.length === TERMS.length;

  const toggle = (idx: number) => {
    setOpenIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const toggleAll = () => {
    setOpenIndexes(allOpen ? [] : TERMS.map((_, i) => i));
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-xs text-ink-muted">
          <strong className="text-ink font-semibold">{TERMS.length} ketentuan</strong> yang berlaku untuk setiap
          penyewaan unit.
        </span>
        <button
          type="button"
          onClick={toggleAll}
          aria-expanded={allOpen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-sand-200 hover:border-sand-300 hover:bg-sand-50 text-[11px] font-semibold text-ink-light transition shadow-warm-sm whitespace-nowrap shrink-0"
        >
          {allOpen ? (
            <>
              <Minus className="w-3.5 h-3.5" /> Tutup Semua
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" /> Buka Semua
            </>
          )}
        </button>
      </div>

      <div className="space-y-3">
        {TERMS.map((item, idx) => {
          const isOpen = openIndexes.includes(idx);
          const Icon = item.icon;
          const num = String(idx + 1).padStart(2, "0");
          const panelId = `ketentuan-panel-${idx}`;
          const buttonId = `ketentuan-button-${idx}`;

          return (
            <div
              key={idx}
              className={`rounded-xl bg-white border transition-all ${
                isOpen ? "border-rust/25 shadow-warm-md" : "border-sand-200 shadow-warm-sm hover:border-sand-300"
              }`}
            >
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(idx)}
                className="group w-full flex items-start justify-between gap-4 p-5 sm:p-6 text-left"
              >
                <span className="flex items-start gap-3 min-w-0">
                  <span
                    className={`shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
                      isOpen ? "bg-rust text-white border-rust" : "bg-sand-100 text-rust border-sand-200 group-hover:border-rust/40"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                      Ketentuan {num}
                    </span>
                    <span
                      className={`block font-serif font-bold text-base mt-0.5 transition-colors ${
                        isOpen ? "text-rust" : "text-ink group-hover:text-rust"
                      }`}
                    >
                      {item.q}
                    </span>
                  </span>
                </span>
                <span
                  className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center transition-all ${
                    isOpen ? "bg-rust text-white border-rust" : "bg-sand-100 border-sand-200 text-ink-muted group-hover:border-sand-300"
                  }`}
                >
                  {isOpen ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </span>
              </button>

              <div id={panelId} role="region" aria-labelledby={buttonId} className="accordion-panel" data-open={isOpen}>
                <div>
                  <p className="px-5 sm:px-6 pb-5 sm:pb-6 text-xs sm:text-sm text-ink-muted leading-relaxed flex items-start gap-2">
                    <Check className="w-4 h-4 text-moss shrink-0 mt-0.5" />
                    <span>{item.a}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
