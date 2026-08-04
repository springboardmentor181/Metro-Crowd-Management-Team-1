import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Card";
import { getSession } from "@/lib/current-user";

export const metadata: Metadata = { title: "Settings" };

const field =
  "w-full rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-3 py-2.5 text-sm outline-none focus:border-[color:var(--color-brand)]";

export default async function SettingsPage() {
  const session = await getSession();
  return (
    <>
      <PageHeader title="Settings" subtitle="Profile and preferences" />
      <div className="grid max-w-3xl gap-6 p-5 lg:p-8">
        <Panel title="Profile">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Full name</span>
              <input defaultValue={session?.name} className={field} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Email</span>
              <input defaultValue={session?.email} disabled className={`${field} opacity-60`} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Role</span>
              <input defaultValue={session?.role} disabled className={`${field} opacity-60`} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Assigned network</span>
              <input defaultValue={session?.network ?? "All networks"} disabled className={`${field} opacity-60`} />
            </label>
          </div>
        </Panel>

        <Panel title="Preferences">
          <p className="text-sm text-[color:var(--color-ink-2)]">
            Theme can be toggled from the top bar. Realtime replay speed and
            notification preferences are configured per deployment.
          </p>
        </Panel>
      </div>
    </>
  );
}
