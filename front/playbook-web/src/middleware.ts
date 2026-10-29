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
const AUTH_ROUTES = [
  "/auth",
  ROUTES.SIGNIN,
  ROUTES.SIGNUP,
  ROUTES.PRIVACY_POLICY,
  ROUTES.TERMS_OF_SERVICE,
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameSegments = pathname.split("/");
  const currentLocale = LOCALES.has(pathnameSegments[1])
    ? pathnameSegments[1]
    : DEFAULT_LOCALE;

  const pathWithoutLocale = pathname.replace(`/${currentLocale}`, "") || "/";

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathWithoutLocale.startsWith(route.split("?")[0]),
  );

  const sessionToken = request.cookies.get("session_id")?.value;

  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathWithoutLocale.startsWith(route),
  );

  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(
      new URL(`/${currentLocale}${ROUTES.HOME}`, request.url),
    );
  }

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
  matcher: [
    String.raw`/((?!api|_next/static|_next/image|favicon.ico|.*\..*).*)`,
  ],
};
