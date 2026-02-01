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

  const enabledProviders = enabledAuthProviders.map((provider) => {
    const key = `${camelSlug(provider.slug)}Settings`;
    const providerSettings = authSettings[key] || null;
    return {
      type: provider.slug,
      ...providerSettings,
    };
  });

  return NextResponse.json({ providers: enabledProviders });
};
