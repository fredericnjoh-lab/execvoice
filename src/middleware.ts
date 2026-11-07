import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

/** Routes that require an authenticated user (locale prefix stripped in matcher). */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/exercise",
  "/session",
  "/progress",
  "/settings",
];

function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  // "", "fr", "dashboard" → /dashboard
  if (segments.length >= 2 && routing.locales.includes(segments[1] as "fr" | "en")) {
    const rest = segments.slice(2).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname;
}

export async function middleware(request: NextRequest) {
  const { response: sessionResponse, user } = await updateSession(request);

  // Run next-intl on a cloned request so locale routing still applies.
  const intlResponse = intlMiddleware(request);

  // Copy refreshed auth cookies onto the intl response.
  sessionResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  const path = stripLocale(request.nextUrl.pathname);
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );

  const locale =
    routing.locales.find((l) => request.nextUrl.pathname.startsWith(`/${l}`)) ??
    routing.defaultLocale;

  // Soft-gate: only redirect when Supabase is configured and user is missing.
  const supabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (supabaseConfigured && isProtected && !user) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    sessionResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return intlResponse;
}

export const config = {
  matcher: ["/", "/(fr|en)/:path*", "/((?!_next|_vercel|.*\\..*).*)"],
};
