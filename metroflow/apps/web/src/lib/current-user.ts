import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  SESSION_COOKIE,
  decodeSession,
  nameForEmail,
  supabaseConfigured,
  type Role,
  type Session,
} from "@/lib/session";

/** Read the current session on the server (RSC / layouts). */
export async function getSession(): Promise<Session | null> {
  // ---- Real Supabase auth ----
  if (supabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const md = (user.user_metadata ?? {}) as { full_name?: string; role?: string };
    const role: Role = md.role === "admin" ? "admin" : "operator";
    return {
      email: user.email ?? "",
      name: md.full_name || nameForEmail(user.email ?? "operator"),
      role,
      network: role === "admin" ? null : "Delhi Metro",
    };
  }

  // ---- Demo cookie fallback ----
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}
