import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createMiddleware(routing);

/**
 * Locale routing + session refresh.
 * Cockpit pages stay publicly reachable (guest mode); APIs enforce auth
 * when persisting profile / sessions. Login & signup remain available.
 */
export async function middleware(request: NextRequest) {
  const { response: sessionResponse } = await updateSession(request);
  const intlResponse = intlMiddleware(request);

  sessionResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
