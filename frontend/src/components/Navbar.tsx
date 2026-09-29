"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  CalendarCheck2,
} from "lucide-react";
import {
  clearAuth,
  subscribeAuth,
  getAuthSnapshot,
  getServerAuthSnapshot,
} from "@/lib/api";
import Logo from "@/components/Logo";

interface NavbarProps {
  onOpenCheckBooking?: () => void;
}

type NavItem = { hash?: string; href?: string; label: string };

const NAV_ITEMS: NavItem[] = [
  { hash: "armada", label: "Katalog Armada" },
  { hash: "ketentuan", label: "Ketentuan" },
  { href: "/service-center", label: "Service Center" },
];

const SECTION_IDS = ["armada", "ketentuan"];

const WHATSAPP_URL =
  "https://wa.me/6282151728477?text=Halo%20ms.Rent,%20saya%20ingin%20tanya%20sewa%20motor";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export default function Navbar({ onOpenCheckBooking }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);

  const { user } = useSyncExternalStore(
    subscribeAuth,
    getAuthSnapshot,
    getServerAuthSnapshot
  );

  const router = useRouter();

  const headerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  // Navigasi route baru selalu menutup menu yang terbuka & reset scrollspy
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
    setDropdownOpen(false);
    setActiveSection(null);
  }

  // Compressed-on-scroll + progress bar (rAF-throttled)
  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrolled(y > 8);
      setProgress(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);
      if (window.innerWidth >= 768) setMobileOpen(false);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Scrollspy: tandai section yang sedang berada di viewport
  useEffect(() => {
    if (pathname !== "/") return;
    if (typeof IntersectionObserver === "undefined") return;

    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (!els.length) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        setActiveSection(SECTION_IDS.find((id) => visible.has(id)) ?? null);
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: 0 }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  // Mobile drawer: kunci scroll body, Esc untuk tutup, focus trap
  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")
      );
      if (!focusables.length) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!panel.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const frame = requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("a[href], button:not([disabled])")
        ?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(frame);
    };
  }, [mobileOpen]);

  // Dropdown akun: tutup saat klik di luar / Esc
  useEffect(() => {
    if (!dropdownOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [dropdownOpen]);

  const navigateToSection = (hash: string) => {
    setMobileOpen(false);
    setDropdownOpen(false);

    if (pathname !== "/") {
      router.push(`/#${hash}`);
      return;
    }

    const el = document.getElementById(hash);
    if (!el) return;
    const offset = (headerRef.current?.offsetHeight ?? 80) + 12;
    const top = Math.max(
      0,
      el.getBoundingClientRect().top + window.scrollY - offset
    );
    requestAnimationFrame(() => window.scrollTo({ top, behavior: "smooth" }));
  };

  const handleLogout = () => {
    clearAuth();
    setDropdownOpen(false);
    setMobileOpen(false);
    if (pathname.startsWith("/admin")) router.push("/");
  };

  const isItemActive = (item: NavItem) =>
    item.hash
      ? pathname === "/" && activeSection === item.hash
      : pathname === item.href;

  const desktopLinkClass = (active: boolean) =>
    [
      "relative py-1 transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-[2px] after:bg-accent after:origin-left after:duration-300 after:transition-transform motion-reduce:after:transition-none",
      active
        ? "text-ink font-bold after:scale-x-100"
        : "text-ink-muted hover:text-ink after:scale-x-0 hover:after:scale-x-100",
    ].join(" ");

  const mobileItemClass = (active: boolean) =>
    [
      "text-left py-2.5 px-3 -mx-3 rounded transition-colors bg-transparent border-0 cursor-pointer animate-fade-up motion-reduce:animate-none",
      active
        ? "text-ink font-bold bg-line/40"
        : "text-ink-muted hover:text-ink hover:bg-line/20",
    ].join(" ");

  const staggerDelay = (index: number) => ({
    animationDelay: `${index * 45}ms`,
  });

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 w-full bg-surface border-b border-line text-ink transition-all duration-300 motion-reduce:transition-none"
    >
      {/* Backdrop mobile drawer */}
      {mobileOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
          className="md:hidden absolute inset-x-0 top-full h-screen bg-dark/40 backdrop-blur-[2px] animate-fade-in motion-reduce:animate-none"
        />
      )}

      <div
        className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-[height] duration-300 ease-out motion-reduce:transition-none ${
          scrolled ? "h-14" : "h-20"
        }`}
      >
        {/* Brand Mark */}
        <Link
          href="/"
          onClick={() => {
            setMobileOpen(false);
            setDropdownOpen(false);
          }}
          className="flex items-center gap-3 group shrink-0"
        >
          <span
            className={`block transition-transform duration-300 ease-out motion-reduce:transition-none ${
              scrolled ? "scale-90" : "scale-100"
            }`}
          >
            <Logo size={40} />
          </span>
          <span
            className={`hidden sm:inline-block text-[11px] font-sans font-medium text-ink-muted tracking-wide pl-3 border-l border-line transition-opacity duration-300 motion-reduce:transition-none ${
              scrolled ? "opacity-0 xl:opacity-100" : "opacity-100"
            }`}
          >
            Garasi Motor Urban Jabodetabek
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center space-x-8 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            const className = desktopLinkClass(active);

            return item.hash ? (
              <button
                key={item.label}
                type="button"
                onClick={() => navigateToSection(item.hash!)}
                aria-current={active ? "location" : undefined}
                className={`${className} bg-transparent border-0 cursor-pointer`}
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.label}
                href={item.href!}
                aria-current={active ? "page" : undefined}
                className={className}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                ref={triggerRef}
                type="button"
                onClick={() => setDropdownOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={dropdownOpen}
                aria-controls="account-menu"
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full border border-line bg-surface hover:bg-bg transition-colors text-ink"
              >
                <span className="w-7 h-7 rounded-full bg-line text-ink grid place-items-center text-[11px] font-bold">
                  {getInitials(user.name)}
                </span>
                <span className="hidden lg:inline text-xs font-semibold text-ink max-w-[8rem] truncate">
                  {user.name}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={`w-3.5 h-3.5 text-ink-muted transition-transform duration-200 motion-reduce:transition-none ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {dropdownOpen && (
                <div
                  id="account-menu"
                  role="menu"
                  aria-label="Menu akun"
                  className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-line bg-surface shadow-lg overflow-hidden animate-scale-in origin-top-right motion-reduce:animate-none text-ink"
                >
                  <div className="px-4 py-3 bg-bg border-b border-line">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-ink-muted">
                      Masuk sebagai
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-ink truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-ink-muted truncate">
                      {user.email}
                    </p>
                    <span className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-line text-ink">
                      {user.role === "admin" ? "Administrator" : "Pelanggan"}
                    </span>
                  </div>

                  <div className="p-1.5">
                    {user.role === "admin" ? (
                      <Link
                        href="/admin"
                        role="menuitem"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-ink hover:bg-bg transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-ink-muted" />
                        Dashboard Admin
                      </Link>
                    ) : (
                      onOpenCheckBooking && (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setDropdownOpen(false);
                            onOpenCheckBooking();
                          }}
                          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-ink hover:bg-bg transition-colors"
                        >
                          <CalendarCheck2 className="w-4 h-4 text-ink-muted" />
                          Lacak Reservasi
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-accent hover:bg-bg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-medium text-ink-muted hover:text-ink px-2.5 py-2 transition-colors"
            >
              Login
            </Link>
          )}

          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-4 py-2.5 rounded-[4px] bg-accent text-accent-ink hover:opacity-90 transition-opacity"
          >
            Hubungi Garasi
          </a>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-haspopup="true"
            className="p-2 rounded text-ink hover:bg-bg transition-colors"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          id="mobile-menu"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
          className="md:hidden relative z-10 border-b border-line bg-surface px-5 py-5 animate-slide-down motion-reduce:animate-none text-ink"
        >
          <nav
            aria-label="Navigasi seluler"
            className="flex flex-col text-sm font-medium text-ink-muted"
          >
            {NAV_ITEMS.map((item, index) => {
              const active = isItemActive(item);
              const className = mobileItemClass(active);

              return item.hash ? (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigateToSection(item.hash!)}
                  style={staggerDelay(index)}
                  aria-current={active ? "location" : undefined}
                  className={className}
                >
                  {item.label}
                </button>
              ) : (
                <Link
                  key={item.label}
                  href={item.href!}
                  onClick={() => setMobileOpen(false)}
                  style={staggerDelay(index)}
                  aria-current={active ? "page" : undefined}
                  className={className}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Akun di mobile */}
          <div
            className="mt-4 pt-4 border-t border-line animate-fade-up motion-reduce:animate-none"
            style={staggerDelay(NAV_ITEMS.length)}
          >
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-1">
                  <span className="w-9 h-9 shrink-0 rounded-full bg-line text-ink grid place-items-center text-xs font-bold">
                    {getInitials(user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-ink-muted truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-ink bg-bg hover:bg-line/40 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-ink-muted" />
                    Dashboard Admin
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-accent hover:bg-bg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Keluar
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-xs font-medium text-ink bg-bg hover:bg-line/40 transition-colors"
              >
                Login Admin
              </Link>
            )}
          </div>

          {/* Aksi WhatsApp */}
          <div
            className="mt-4 pt-4 border-t border-line flex flex-col gap-2 animate-fade-up motion-reduce:animate-none"
            style={staggerDelay(NAV_ITEMS.length + 1)}
          >
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center text-xs font-semibold py-3 rounded-[4px] bg-accent text-accent-ink hover:opacity-90 transition-opacity"
            >
              WhatsApp Garasi (0821-5172-8477)
            </a>
          </div>
        </div>
      )}

      {/* Scroll progress bar - solid token accent */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] origin-left bg-accent"
        style={{ transform: `scaleX(${progress})` }}
      />
    </header>
  );
}

