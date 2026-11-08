import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase Auth callback — exchanges ?code= for a session cookie.
 * Configure this URL in Supabase Auth redirect allow-list:
 *   https://execvoice.vercel.app/auth/callback
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/fr/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const safeNext =
        next.startsWith("/") && !next.startsWith("//") ? next : "/fr/dashboard";
      return NextResponse.redirect(new URL(safeNext, origin));
    }
  }

  return NextResponse.redirect(new URL("/fr/login?error=auth", origin));
}
