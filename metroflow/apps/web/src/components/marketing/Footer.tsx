import Link from "next/link";
import { LogoWordmark } from "@/components/brand/Logo";
import { Globe, Mail, Share2 } from "lucide-react";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Crowd Monitoring", href: "/features#crowd" },
      { label: "Scheduling", href: "/features#scheduling" },
      { label: "AI Prediction", href: "/ai" },
      { label: "Analytics", href: "/features#analytics" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/#platform" },
      { label: "Impact", href: "/#impact" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "How it works", href: "/#how" },
      { label: "Technology", href: "/ai" },
      { label: "Enter Dashboard", href: "/login" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--color-hairline)] bg-[color:var(--color-surface-2)]">
      <div className="container-mf grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <LogoWordmark />
          <p className="mt-3 max-w-xs text-sm text-[color:var(--color-ink-2)]">
            Privacy-preserving AI command center for metro operators. Predict the
            crowd. Move the city.
          </p>
          <div className="mt-4 flex gap-2 text-[color:var(--color-muted)]">
            <Link href="#" aria-label="Website" className="hover:text-[color:var(--color-brand)]"><Globe size={18} /></Link>
            <Link href="#" aria-label="Email" className="hover:text-[color:var(--color-brand)]"><Mail size={18} /></Link>
            <Link href="#" aria-label="Share" className="hover:text-[color:var(--color-brand)]"><Share2 size={18} /></Link>
          </div>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold text-[color:var(--color-ink)]">
              {col.title}
            </h4>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-[color:var(--color-ink-2)] hover:text-[color:var(--color-brand)]"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="bg-[color:var(--color-brand-900)] py-4 text-center text-xs text-white/70">
        © {new Date().getFullYear()} MetroFlow · AI Metro Crowd Management &
        Smart Scheduling Platform · Built for smart-city transportation.
      </div>
    </footer>
  );
}
