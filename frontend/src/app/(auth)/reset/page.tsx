import Link from "next/link";
import type { Metadata } from "next";
import { ResetForm } from "@/components/auth/ResetForm";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Reset password</h1>
      <p className="mt-1 text-sm text-[color:var(--color-ink-2)]">
        We&apos;ll send a recovery link to your email.
      </p>
      <ResetForm />
      <p className="mt-4 text-center text-sm text-[color:var(--color-ink-2)]">
        <Link href="/login" className="font-medium text-[color:var(--color-brand)] hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
