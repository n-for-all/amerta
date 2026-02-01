import { NextResponse } from "next/server";
import { getAuthProvider } from ".."; // Your adapter manager
import { Config, PayloadRequest } from "payload";
import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import { Settings } from "@/payload-types";
import { camelSlug } from "@/amerta/utilities/camelSlug";
import { getServerSideURL, getURL } from "@/amerta/utilities/getURL";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { DEFAULT_LOCALE } from "@/amerta/localization/locales";
import { CUSTOMER_AUTH_TOKEN } from "@/amerta/constants";

export const oauthCallback = async (req: PayloadRequest) => {
  const params = req.routeParams as { provider?: string; locale?: string };
  const locale = params.locale || DEFAULT_LOCALE;
  const adapter = getAuthProvider(params.provider!);

  if (!adapter) return new NextResponse("Provider not found", { status: 404 });

  // 1. Get Settings
  const authSettings: Settings = await getCachedGlobal("settings" as keyof Config["globals"], 1)();
  const key = `${camelSlug(adapter.slug)}Settings`;
  const providerSettings = authSettings[key] || null;

  if (!providerSettings || !providerSettings.enabled) {
    return NextResponse.redirect(getURL(`/login?error=${encodeURIComponent("Provider is disabled")}`, locale));
  }

  // 2. Parse URL Params (code & state)
  const url = new URL(req.url!);
  const searchParams = url.searchParams;

  // 3. Get Cookies (State & Verifier)
  const cookieStore = await cookies();
  const cookieMap = new Map<string, string>();
  cookieStore.getAll().forEach((c) => cookieMap.set(c.name, c.value));

  // 4. Authenticate with Adapter
  const authResult = await adapter.authenticate({
    req,
    settings: providerSettings,
    searchParams,
    cookies: cookieMap,
    redirectUri: `${getServerSideURL()}/api/auth/${adapter.slug}/callback`,
  });

  if (authResult.status !== "success") {
    console.error(`OAuth Error: ${authResult.status === "error" ? authResult.message : "Unknown"}`);
    return NextResponse.redirect(getURL(`/login?error=${encodeURIComponent("OAuth failed")}`, locale));
  }

  // ---------------------------------------------------------
  // 5. Payload Logic: Find or Create User
  // ---------------------------------------------------------
  const collectionSlug = "customers"; // or "customers"
  const email = authResult.user.email;

  // Find existing user
  const existingUsers = await req.payload.find({
    collection: collectionSlug,
    where: {
      email: { equals: email },
    },
  });

  let user = existingUsers.docs[0];

  // Create if doesn't exist
  if (!user) {
    try {
      const firstName = authResult.user.name ? authResult.user.name.split(" ")[0] : "";
      const lastName = authResult.user.name ? authResult.user.name.split(" ").slice(1).join(" ") : " ";
      user = await req.payload.create({
        collection: collectionSlug,
        data: {
          email: email,
          password: crypto.randomUUID(),
          firstName: firstName,
          lastName: lastName,
        },
      });
    } catch (e) {
      console.error("Failed to create user", e);
      return NextResponse.redirect(getURL(`/login?error=${encodeURIComponent("User creation failed")}`, locale));
    }
  }

  // ---------------------------------------------------------
  // 6. Login Logic: Manual JWT Generation
  // ---------------------------------------------------------
  // We cannot use payload.login() because we don't know the password.
  // We must sign a JWT manually using Payload's secret.

  const token = jwt.sign(
    {
      email: user.email,
      id: user.id,
      collection: collectionSlug,
    },
    req.payload.secret,
    {
      expiresIn: "7d", // Match your collection config
    },
  );

  const response = NextResponse.redirect(getURL(`/account`, locale));
  response.cookies.set(CUSTOMER_AUTH_TOKEN, token, {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
};
