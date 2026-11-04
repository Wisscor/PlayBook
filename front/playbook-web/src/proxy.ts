import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTES } from "./lib/constants";

const LOCALES = new Set(["en", "fr", "ar"]);
const DEFAULT_LOCALE = "en";

const PROTECTED_ROUTES = [
  ROUTES.HOME,
  ROUTES.EDIT_PROFILE,
  ROUTES.PROFILE,
  ROUTES.POSTS,
  ROUTES.MATCHES,
  ROUTES.COMMUNITY,
  ROUTES.USER_PROFILE,
  ROUTES.SEARCH,
  ROUTES.MESSAGES,
  ROUTES.FOLLOWERS,
  ROUTES.PLAY_REQUESTS,
];

const GUEST_ONLY_ROUTES = ["/auth", ROUTES.SIGNIN, ROUTES.SIGNUP];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameSegments = pathname.split("/");
  const currentLocale = LOCALES.has(pathnameSegments[1])
    ? pathnameSegments[1]
    : DEFAULT_LOCALE;

  const pathWithoutLocale = pathname.replace(`/${currentLocale}`, "") || "/";
  const sessionToken = request.cookies.get("session_id")?.value;

  const isGuestOnlyRoute = GUEST_ONLY_ROUTES.some((route) =>
    pathWithoutLocale.startsWith(route.split("?")[0]),
  );

  const isExpiredSessionRedirect =
    request.nextUrl.searchParams.get("sessionExpired") === "1";

  if (isGuestOnlyRoute && sessionToken && !isExpiredSessionRedirect) {
    return NextResponse.redirect(
      new URL(`/${currentLocale}${ROUTES.HOME}`, request.url),
    );
  }

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathWithoutLocale.startsWith(route.split("?")[0]),
  );

  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL(`/${currentLocale}${ROUTES.SIGNIN}`, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();

  if (isProtectedRoute) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
