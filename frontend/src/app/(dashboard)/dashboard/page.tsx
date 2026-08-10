import { PageHeader } from "@/components/dashboard/PageHeader";
import { getSession } from "@/lib/current-user";

export default async function OverviewPage() {
  const session = await getSession();

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${session?.name ?? "User"}`}
      />

      <div className="space-y-6 p-5 lg:p-8">
        <div
          className="relative overflow-hidden rounded-[var(--radius-lg)] p-5 text-white sm:p-6"
          style={{ background: "linear-gradient(120deg,var(--color-brand-900),var(--color-brand) 60%,var(--color-ai))" }}
        >
          <div className="relative z-10 flex flex-wrap items-center gap-4">
            <div className="max-w-xl">
              <h2 className="mt-1.5 font-display text-xl font-bold sm:text-2xl">
                User Management System
              </h2>
              <p className="mt-1 text-sm text-white/85">
                Manage operators, assign roles, and update profile settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
