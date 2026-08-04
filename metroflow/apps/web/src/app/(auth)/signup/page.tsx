import Link from "next/link";
import type { Metadata } from "next";
import { UserPlus, Info } from "lucide-react";
import { signInAction } from "@/lib/auth-actions";
import { Button } from "@/components/ui/Button";
import { supabaseConfigured } from "@/lib/session";

export const metadata: Metadata = { title: "Create account" };

const field =
  "w-full rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-100)]";

export default function SignupPage() {
  const demo = !supabaseConfigured();
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Create account</h1>
      <p className="mt-1 text-sm text-[color:var(--color-ink-2)]">
        Operators are approved by an administrator after signup.
      </p>

      <form action={signInAction} className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Full name</span>
          <input name="name" required placeholder="Jane Operator" className={field} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Work email</span>
          <input name="email" type="email" required placeholder="jane@metro.gov" className={field} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Password</span>
          <input name="password" type="password" required placeholder="••••••••" className={field} />
        </label>
        <input type="hidden" name="role" value="operator" />
        <Button type="submit" variant="primary" className="w-full">
          <UserPlus size={18} /> Create account
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-[color:var(--color-ink-2)]">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-[color:var(--color-brand)] hover:underline">
          Sign in
        </Link>
      </p>

      {demo && (
        <div className="mt-6 flex items-start gap-2 rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface-2)] p-3 text-xs text-[color:var(--color-ink-2)]">
          <Info size={15} className="mt-0.5 shrink-0 text-[color:var(--color-ai)]" />
          <span>
            <strong>Demo mode.</strong> Creates a local operator session. Real
            email verification is handled by Supabase once configured.
          </span>
        </div>
      )}
    </div>
  );
}
