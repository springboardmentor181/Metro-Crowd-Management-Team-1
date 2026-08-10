"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  SESSION_COOKIE,
  encodeSession,
  nameForEmail,
  roleForEmail,
  supabaseConfigured,
  type Session,
} from "@/lib/session";

const NETWORKS: Record<string, string | null> = { admin: null, operator: "Delhi Metro" };

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const requestedRole = String(formData.get("role") || "");
  if (!email) return;

  // ---- Real Supabase auth ----
  if (supabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
    redirect("/dashboard");
  }

  // ---- Demo fallback ----
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
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim() || nameForEmail(email);
  if (!email) return;

  if (supabaseConfigured()) {
    // Create a confirmed account via the backend (bypasses email confirmation),
    // then sign the new operator straight in.
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";
    let ok = false;
    let errMsg = "Registration failed. Please try again.";
    try {
      const res = await fetch(`${base}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: name }),
        cache: "no-store",
      });
      if (res.ok) {
        ok = true;
      } else {
        const d = await res.json().catch(() => ({}));
        errMsg = d?.detail || d?.error?.message || errMsg;
      }
    } catch {
      errMsg = "Could not reach the server. Make sure the API is running.";
    }
    if (!ok) redirect(`/signup?error=${encodeURIComponent(errMsg)}`);

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
    redirect("/dashboard");
  }

  // demo fallback: sign straight in as operator
  await signInAction(formData);
}

export async function signOutAction() {
  if (supabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
