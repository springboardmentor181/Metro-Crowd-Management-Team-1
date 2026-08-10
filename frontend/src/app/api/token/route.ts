import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Returns the current session's access token — used by the browser to
 *  authenticate the WebSocket connection to the realtime API. */
export async function GET() {
  try {
    const { data } = await (await createClient()).auth.getSession();
    return NextResponse.json({ token: data.session?.access_token ?? null });
  } catch {
    return NextResponse.json({ token: null });
  }
}
