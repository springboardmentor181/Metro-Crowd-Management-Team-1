"use client";

import { useState } from "react";
import { MailCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient, supabaseConfigured } from "@/lib/supabase/client";

const field =
  "w-full rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-100)]";

export function ResetForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (supabaseConfigured()) {
      try {
        await createClient().auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/login`,
        });
      } catch {
        // fall through — we always show the same neutral confirmation
      }
    }
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="mt-6 flex flex-col items-center rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface-2)] p-6 text-center">
        <MailCheck size={32} className="text-[color:var(--color-crowd-low)]" />
        <p className="mt-3 text-sm text-[color:var(--color-ink-2)]">
          If an account exists for <strong>{email}</strong>, a recovery link is on its way.
        </p>
      </div>
    );
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@metro.gov"
          className={field}
        />
      </label>
      <Button type="submit" variant="primary" className="w-full">
        {loading ? <Loader2 size={16} className="animate-spin" /> : null} Send recovery link
      </Button>
    </form>
  );
}
