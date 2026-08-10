import { redirect } from "next/navigation";
import { getSession } from "@/lib/current-user";
import { Shell } from "@/components/dashboard/Shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");
  return <Shell session={session}>{children}</Shell>;
}
