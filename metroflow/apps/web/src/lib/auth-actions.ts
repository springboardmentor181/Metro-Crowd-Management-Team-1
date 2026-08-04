"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  encodeSession,
  nameForEmail,
  roleForEmail,
  type Session,
} from "@/lib/session";

const NETWORKS: Record<string, string | null> = {
  admin: null, // all networks
  operator: "Delhi Metro",
};

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const requestedRole = String(formData.get("role") || "");
  if (!email) return;

  const role =
    requestedRole === "admin" || requestedRole === "operator"
      ? (requestedRole as "admin" | "operator")
      : roleForEmail(email);

  const session: Session = {
    email,
    name: nameForEmail(email),
    role,
    network: NETWORKS[role] ?? null,
  };

  // NOTE: when Supabase is configured, replace the demo cookie with a real
  // supabase.auth.signInWithPassword() session (Doc 09 auth flow).
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect("/dashboard");
}

export async function signOutAction() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
