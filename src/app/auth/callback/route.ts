import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase Auth callback — exchanges ?code= for a session cookie.
 * Configure this URL in Supabase Auth redirect allow-list.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/fr/onboarding";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Validate next is a relative path to avoid open redirects.
      const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/fr/dashboard";
      return NextResponse.redirect(new URL(safeNext, origin));
    }
  }

  return NextResponse.redirect(new URL("/fr/login?error=auth", origin));
}
