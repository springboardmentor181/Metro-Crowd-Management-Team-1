import type { Metadata } from "next";
import { ContactForm } from "@/components/marketing/ContactForm";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <section className="bg-[color:var(--color-surface-2)] pt-28 pb-24 min-h-screen">
      <div className="container-mf grid gap-12 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">
            Request access
          </h1>
          <p className="mt-4 max-w-md text-[color:var(--color-ink-2)]">
            Tell us about your network and we&apos;ll set up a MetroFlow command
            center for your operations team.
          </p>
          <dl className="mt-8 space-y-4 text-sm">
            <div>
              <dt className="font-semibold">For</dt>
              <dd className="text-[color:var(--color-ink-2)]">
                Metro administrators, station operators, transportation managers
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Deployment</dt>
              <dd className="text-[color:var(--color-ink-2)]">
                Cloud (AWS / Azure), Docker, Supabase-backed
              </dd>
            </div>
          </dl>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
