import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle root path (/) explicitly for localePrefix: "as-needed"
  // next-intl middleware has a known issue with root path + localePrefix: "as-needed"
  if (pathname === "/") {
    const response = NextResponse.next();
    response.cookies.set("NEXT_LOCALE", "pt-BR", { path: "/", sameSite: "lax" });
    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};