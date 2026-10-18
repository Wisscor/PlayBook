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
];
const AUTH_ROUTES = [ROUTES.SIGNIN, ROUTES.SIGNUP];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameSegments = pathname.split("/");
  const currentLocale = LOCALES.has(pathnameSegments[1])
    ? pathnameSegments[1]
    : DEFAULT_LOCALE;

  const pathWithoutLocale = pathname.replace(`/${currentLocale}`, "") || "/";

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathWithoutLocale.startsWith(route),
  );

  const sessionToken = request.cookies.get("user_session")?.value;

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

  return NextResponse.next();
}

export const config = {
  matcher: [
    String.raw`/((?!api|_next/static|_next/image|favicon.ico|.*\..*).*)`,
  ],
};
