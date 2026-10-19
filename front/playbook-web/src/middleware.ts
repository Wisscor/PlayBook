import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = new Set(["en", "fr", "ar"]);
const DEFAULT_LOCALE = "en";

const PROTECTED_ROUTES = ["/home", "/profile"];
const AUTH_ROUTES = ["/auth"];

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

  const sessionToken = request.cookies.get("session_id")?.value;

  const isAuthRoute = AUTH_ROUTES.some((route) =>
    pathWithoutLocale.startsWith(route),
  );

  const previewMode = process.env.NEXT_PUBLIC_PREVIEW_MODE === "true";

  if (previewMode) {
    return NextResponse.next();
  }

  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(
      new URL(`/${currentLocale}/home`, request.url),
    );
  }

  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL(`/${currentLocale}/auth?mode=signin`, request.url);

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
