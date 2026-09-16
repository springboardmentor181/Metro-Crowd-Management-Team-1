"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="card flex flex-col items-center justify-center p-10 text-center">
        <CheckCircle2 size={40} className="text-[color:var(--color-crowd-low)]" />
        <h2 className="mt-4 text-xl font-semibold">Request received</h2>
        <p className="mt-2 text-sm text-[color:var(--color-ink-2)]">
          Thanks — our team will reach out shortly to set up your access.
        </p>
      </div>
    );
  }

  const field =
    "w-full rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-100)]";

  return (
    <form
      className="card space-y-4 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Full name</span>
          <input required className={field} placeholder="Jane Operator" />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Work email</span>
          <input required type="email" className={field} placeholder="jane@metro.gov" />
        </label>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Organization</span>
        <input required className={field} placeholder="Delhi Metro Rail Corporation" />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Role</span>
        <select className={field} defaultValue="operator">
          <option value="admin">Administrator</option>
          <option value="operator">Station operator</option>
          <option value="manager">Transportation manager</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Message</span>
        <textarea rows={4} className={field} placeholder="Tell us about your network…" />
      </label>
      <Button type="submit" variant="accent" className="w-full">
        Request access
      </Button>
    </form>
  );
}
