import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { LogoWordmark } from "@/components/brand/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-[color:var(--color-brand)] lg:block">
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "url(/assets/img/brand-pattern.png)",
            backgroundSize: "560px",
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Link href="/">
            <LogoWordmark variant="reversed" />
          </Link>
          <div>
            <h2 className="font-display text-4xl font-bold leading-tight">
              The metro command center
            </h2>
            <p className="mt-4 max-w-sm text-white/80">
              Monitor passenger flow, forecast demand and optimize schedules
              across your network — in real time.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs">
              <ShieldCheck size={14} /> Privacy-preserving · no cameras
            </div>
          </div>
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} MetroFlow
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-[color:var(--color-plane)] p-6">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
