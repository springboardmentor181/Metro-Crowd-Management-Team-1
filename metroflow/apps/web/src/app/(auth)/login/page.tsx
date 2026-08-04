import Link from "next/link";
import type { Metadata } from "next";
import { LogIn, Info } from "lucide-react";
import { signInAction } from "@/lib/auth-actions";
import { Button } from "@/components/ui/Button";
import { supabaseConfigured } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

const field =
  "w-full rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-100)]";

export default function LoginPage() {
  const demo = !supabaseConfigured();
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Sign in</h1>
      <p className="mt-1 text-sm text-[color:var(--color-ink-2)]">
        Access the MetroFlow operations dashboard.
      </p>

      <form action={signInAction} className="mt-6 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            placeholder="operator@metro.gov"
            className={field}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className={field}
          />
        </label>

        {demo && (
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Sign in as (demo)</span>
            <select name="role" className={field} defaultValue="operator">
              <option value="operator">Operator</option>
              <option value="admin">Administrator</option>
            </select>
          </label>
        )}

        <Button type="submit" variant="primary" className="w-full">
          <LogIn size={18} /> Sign in
        </Button>
      </form>

      <div className="mt-4 flex items-center justify-between text-sm">
        <Link
          href="/reset"
          className="text-[color:var(--color-ink-2)] hover:text-[color:var(--color-brand)]"
        >
          Forgot password?
        </Link>
        <Link
          href="/signup"
          className="font-medium text-[color:var(--color-brand)] hover:underline"
        >
          Create account
        </Link>
      </div>

      {demo && (
        <div className="mt-6 flex items-start gap-2 rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface-2)] p-3 text-xs text-[color:var(--color-ink-2)]">
          <Info size={15} className="mt-0.5 shrink-0 text-[color:var(--color-ai)]" />
          <span>
            <strong>Demo mode.</strong> Supabase isn&apos;t configured yet — any
            email/password works. Pick a role to explore. Add Supabase keys in{" "}
            <code>.env.local</code> to enable real authentication.
          </span>
        </div>
      )}
    </div>
  );
}
