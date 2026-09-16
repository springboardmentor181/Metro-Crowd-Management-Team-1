"use client";

import { useEffect, useState } from "react";
import { UserPlus, Loader2, X, AlertCircle, Database } from "lucide-react";
import { getUsers, inviteUser, type ApiUser } from "@/lib/api";

const field =
  "w-full rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-brand)]";

export function UsersManager() {
  const [users, setUsers] = useState<ApiUser[] | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "operator" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setUsers((await getUsers()) ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await inviteUser(form);
    setBusy(false);
    if (res.ok) {
      setOpen(false);
      setForm({ full_name: "", email: "", password: "", role: "operator" });
      load();
    } else {
      setError(res.error || "Invite failed");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs text-[color:var(--color-muted)]">
          <Database size={13} className="text-[color:var(--color-crowd-low)]" />
          {users ? `${users.length} users` : "Loading…"} · live from Supabase Auth
        </span>
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-card)] bg-[color:var(--color-brand)] px-3 py-1.5 text-sm font-medium text-white hover:bg-[color:var(--color-brand-900)]"
        >
          {open ? <X size={15} /> : <UserPlus size={15} />} {open ? "Cancel" : "Invite user"}
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="rounded-[var(--radius-card)] border border-[color:var(--color-hairline)] bg-[color:var(--color-surface-2)] p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input required placeholder="Full name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={field} />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
            <input required type="password" placeholder="Temporary password (min 6)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={field} />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={field}>
              <option value="operator">Operator</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          {error && (
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[color:var(--color-crowd-critical)]">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <button type="submit" disabled={busy} className="mt-3 inline-flex items-center gap-1.5 rounded-[var(--radius-card)] bg-[color:var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--color-accent-600)] disabled:opacity-50">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} Create account
          </button>
        </form>
      )}

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
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-[color:var(--color-hairline)] last:border-0">
                <td className="py-3 font-medium">{u.full_name || "—"}</td>
                <td className="py-3 text-[color:var(--color-ink-2)]">{u.email}</td>
                <td className="py-3">
                  <span className="rounded-full bg-[color:var(--color-brand-100)] px-2 py-0.5 text-[11px] font-semibold uppercase text-[color:var(--color-brand)]">
                    {u.role}
                  </span>
                </td>
                <td className="py-3 text-[color:var(--color-ink-2)]">{u.network}</td>
                <td className="py-3">
                  {u.is_active ? (
                    <span className="text-xs text-[color:var(--color-crowd-low)]">● Active</span>
                  ) : (
                    <span className="text-xs text-[color:var(--color-muted)]">● Inactive</span>
                  )}
                </td>
              </tr>
            ))}
            {users && users.length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-sm text-[color:var(--color-muted)]">No users yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
