/**
 * Session layer — Supabase-ready with a demo fallback.
 *
 * When NEXT_PUBLIC_SUPABASE_URL is set, real Supabase Auth is used (wired in
 * lib/supabase). Until then, a signed-ish cookie holds a demo session so the
 * whole product is navigable without a backend. Role heuristic: an email
 * containing "admin" → admin, otherwise operator (Doc 08 roles).
 */

export type Role = "admin" | "operator";

export type Session = {
  email: string;
  name: string;
  role: Role;
  network: string | null;
};

export const SESSION_COOKIE = "mf_session";

export const supabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

export function roleForEmail(email: string): Role {
  return /admin|manager|authority/i.test(email) ? "admin" : "operator";
}

export function nameForEmail(email: string): string {
  const handle = email.split("@")[0] || "operator";
  return handle
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function encodeSession(s: Session): string {
  return Buffer.from(JSON.stringify(s), "utf8").toString("base64url");
}

export function decodeSession(raw: string | undefined): Session | null {
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as Session;
  } catch {
    return null;
  }
}
