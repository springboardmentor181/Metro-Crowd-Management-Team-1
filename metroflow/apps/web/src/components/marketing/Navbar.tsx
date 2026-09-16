"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { LogoWordmark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Platform", href: "/#platform" },
  { label: "Features", href: "/features" },
  { label: "AI", href: "/ai" },
  { label: "Impact", href: "/#impact" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-200",
        scrolled
          ? "bg-[color:var(--color-brand)]/95 backdrop-blur border-b border-white/10"
          : "bg-transparent"
      )}
    >
      <nav className="container-mf flex h-16 items-center justify-between">
        <Link href="/" aria-label="MetroFlow home">
          <LogoWordmark variant="reversed" />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className="rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Button href="/login" variant="accent" size="sm">
            Enter Dashboard
          </Button>
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-white/10 bg-[color:var(--color-brand)] px-5 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-white/90 hover:bg-white/10"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center gap-2">
              <Button href="/login" variant="accent" size="sm" className="flex-1">
                Enter Dashboard
              </Button>
              <ThemeToggle className="text-white hover:bg-white/10" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
