import { NextResponse } from "next/server";
import { getAuthProvider } from "..";
import { Config, PayloadRequest } from "payload";
import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import { Settings } from "@/payload-types";
import { camelSlug } from "@/amerta/utilities/camelSlug";
import { getServerSideURL } from "@/amerta/utilities/getURL";
import { cookies } from "next/headers";

export const authenticateOauth = async (req: PayloadRequest) => {
  try {
    const params = req.routeParams as { provider?: string; locale?: string };
    const adapter = getAuthProvider(params.provider!);

    if (!adapter) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // 1. Get Settings
    const authSettings: Settings = await getCachedGlobal("settings" as keyof Config["globals"], 1)();
    const key = `${camelSlug(adapter.slug)}Settings`;
    const providerSettings = authSettings[key] || null;

    if (!providerSettings || !providerSettings.enabled) {
      return NextResponse.json({ error: "Provider is disabled or not configured" }, { status: 400 });
    }

    // 2. Generate URL
    const result = await adapter.generateAuthUrl({
      req,
      settings: providerSettings,
      redirectUri: `${getServerSideURL()}/api/auth/${adapter.slug}/${params.locale}/callback`,
    });

    // ---------------------------------------------------------
    // 3. Handle Different Statuses Robustly
    // ---------------------------------------------------------

    // Case A: Redirect (Standard OAuth)
    if (result.status === "redirect") {
      const cookieStore = await cookies();

      // Set state/verifier cookies securely
      if (result.cookiesToSet) {
        for (const c of result.cookiesToSet) {
          cookieStore.set(c.name, c.value, c.options);
        }
      }

      // Return the URL so the frontend can `window.location.href = data.url`
      return NextResponse.json({ status: "redirect", url: result.url });
    }

    // Case B: Immediate Success (Rare for OAuth init, but good to handle)
    if (result.status === "success") {
      return NextResponse.json(result, { status: 200 });
    }

    // Case C: Explicit Error from Adapter
    if (result.status === "error") {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    // Case D: Unknown State
    return NextResponse.json({ error: "Unknown authentication state" }, { status: 500 });
  } catch (error) {
    console.error("Auth Init Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};
