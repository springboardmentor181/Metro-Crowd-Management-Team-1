import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Card";
import { getSession } from "@/lib/current-user";

export const metadata: Metadata = { title: "Users" };

const USERS = [
  { name: "Asha Verma", email: "admin@metro.gov", role: "admin", network: "All networks", active: true },
  { name: "Ravi Kumar", email: "ravi@metro.gov", role: "operator", network: "Delhi Metro", active: true },
  { name: "Neha Singh", email: "neha@metro.gov", role: "operator", network: "Mumbai Metro", active: true },
  { name: "Imran Ali", email: "imran@metro.gov", role: "operator", network: "Bengaluru Metro", active: false },
];

export default async function UsersPage() {
  const session = await getSession();
  if (session?.role !== "admin") redirect("/dashboard");

  return (
    <>
      <PageHeader
        title="User Management"
        subtitle="Roles and network access"
        actions={
          <button className="inline-flex items-center gap-1.5 rounded-[var(--radius-card)] bg-[color:var(--color-brand)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[color:var(--color-brand-900)]">
            <UserPlus size={15} /> Invite user
          </button>
        }
      />
      <div className="p-5 lg:p-8">
        <Panel title="Operators & administrators">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--color-hairline)] text-left text-xs text-[color:var(--color-muted)]">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Network</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {USERS.map((u) => (
                  <tr key={u.email} className="border-b border-[color:var(--color-hairline)] last:border-0">
                    <td className="py-3 font-medium">{u.name}</td>
                    <td className="py-3 text-[color:var(--color-ink-2)]">{u.email}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-[color:var(--color-brand-100)] px-2 py-0.5 text-[11px] font-semibold uppercase text-[color:var(--color-brand)]">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 text-[color:var(--color-ink-2)]">{u.network}</td>
                    <td className="py-3">
                      {u.active ? (
                        <span className="text-xs text-[color:var(--color-crowd-low)]">● Active</span>
                      ) : (
                        <span className="text-xs text-[color:var(--color-muted)]">● Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
