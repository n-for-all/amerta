import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import { Config } from "payload";
import { Settings } from "@/payload-types";
import { AUTH_PROVIDERS } from "@/amerta/auth";
import { camelSlug } from "@/amerta/utilities/camelSlug";
import { NextResponse } from "next/server";

export const getEnabledAuthProviders = async () => {
  const authSettings: Settings = await getCachedGlobal("settings" as keyof Config["globals"], 1)();
  const enabledAuthProviders = AUTH_PROVIDERS.filter((provider) => {
    const key = `${camelSlug(provider.slug)}Settings`;
    const providerSettings = authSettings[key] || null;
    if (!providerSettings || !providerSettings.enabled) return false;
    return true;
  });

  // Public endpoint: return only what the login buttons need. The settings hold secrets
  // (e.g. the Google client secret) and must never be sent to the browser.
  const enabledProviders = enabledAuthProviders.map((provider) => ({
    type: provider.slug,
    label: provider.label,
  }));

  return NextResponse.json({ providers: enabledProviders });
};
