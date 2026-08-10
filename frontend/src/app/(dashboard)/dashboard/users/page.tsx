import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Panel } from "@/components/dashboard/Card";
import { UsersManager } from "@/components/dashboard/UsersManager";
import { getSession } from "@/lib/current-user";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const session = await getSession();
  if (session?.role !== "admin") redirect("/dashboard");

  return (
    <>
      <PageHeader title="User Management" subtitle="Roles and network access — live from Supabase Auth" />
      <div className="p-5 lg:p-8">
        <Panel title="Operators & administrators">
          <UsersManager />
        </Panel>
      </div>
    </>
  );
}
