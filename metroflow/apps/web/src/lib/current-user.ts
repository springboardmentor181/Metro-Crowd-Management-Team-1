import { cookies } from "next/headers";
import { SESSION_COOKIE, decodeSession, type Session } from "@/lib/session";

/** Read the current session on the server (RSC / layouts). */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value);
}
