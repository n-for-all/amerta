import { CUSTOMER_AUTH_TOKEN } from "@/amerta/constants";
import { DEFAULT_LOCALE, LocaleCode, LOCALES } from "@/amerta/localization/locales";
import { getURL } from "@/amerta/utilities/getURL";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const sendResponse = (type: string, request: NextRequest, url: URL, search) => {
  let response: NextResponse | null = null;

  switch (type) {
    case "redirect":
      url.search = search;
      response = NextResponse.redirect(url!);
      break;
    case "rewrite":
      url.search = search;
      response = NextResponse.rewrite(url!);
      break;
    case "next":
    default:
      response = NextResponse.next();
  }

  const host = request.headers.get("host") || "";
  const subdomain = host.split(".")[0];

  //! We will pass these headers for us to match the store if needed in the future
  response.headers.set("x-url", request.nextUrl.pathname);
  response.headers.set("x-domain", host);
  response.headers.set("x-subdomain", subdomain!);

  return response;
};

const trimSlashes = (str: string) => str.replace(/^\/+|\/+$/g, "");

export function proxy(request: NextRequest) {
  const ADMIN_PATH = trimSlashes(process.env.PAYLOAD_ADMIN_ROUTE || "admin");
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith(`/${ADMIN_PATH}`)) {
    const publicAdminRoutes = [`/${ADMIN_PATH}/login`, `/${ADMIN_PATH}/logout`, `/${ADMIN_PATH}/forgot`, `/${ADMIN_PATH}/create-first-user`];

    if (publicAdminRoutes.includes(pathname) || pathname.startsWith(`/${ADMIN_PATH}/reset/`)) {
      return NextResponse.next();
    }

    const token = request.cookies.get("payload-token")?.value;

    if (!token) {
      const loginUrl = new URL(`/${ADMIN_PATH}/login`, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const collection = getPayloadCollection(token);

      if (collection !== "users") {
        const response = NextResponse.redirect(new URL(`/${ADMIN_PATH}/login`, request.url));
        response.cookies.delete("payload-token");
        return response;
      }
    } catch {
      const response = NextResponse.redirect(new URL(`/${ADMIN_PATH}/login`, request.url));
      response.cookies.delete("payload-token");
      return response;
    }
    return NextResponse.next();
  }

  const pathnameIsMissingLocale = LOCALES.every((locale) => !pathname.startsWith(`/${locale.code}/`) && pathname !== `/${locale.code}`);

  let currentLocale = DEFAULT_LOCALE;
  if (!pathnameIsMissingLocale) {
    currentLocale = pathname.split("/")[1] as LocaleCode;
  }

  const isAccountPage = pathname.match(new RegExp(`^(/(${LOCALES.map((l) => l.code).join("|")}))?/account(/.*)?$`));
  if (isAccountPage) {
    const token = request.cookies.get(CUSTOMER_AUTH_TOKEN)?.value;

    if (!token) {
      const loginUrl = new URL(getURL(`/login`, currentLocale), request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return sendResponse("redirect", request, loginUrl, search);
    }

    try {
      const collection = getPayloadCollection(token);

      if (collection !== "customers") {
        const loginUrl = new URL(getURL(`/login`, currentLocale), request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return sendResponse("redirect", request, loginUrl, search);
      }
    } catch {
      return sendResponse("redirect", request, new URL(getURL(`/login`, currentLocale), request.url), search);
    }
  }

  if (pathnameIsMissingLocale) {
    return sendResponse("rewrite", request, new URL(`/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`, request.url), search);
  } else {
    return sendResponse("next", request, new URL(request.url), search);
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|next|_next/image|assets|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|manifest.json).*)", "/:locale/account/:path*", "/account/:path*"],
};

function getPayloadCollection(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    let base64 = parts[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    if (pad) {
      base64 += "=".repeat(4 - pad);
    }

    const jsonPayload = atob(base64);
    const parsed = JSON.parse(jsonPayload);

    return parsed.collection || null;
  } catch {
    return null;
  }
}
