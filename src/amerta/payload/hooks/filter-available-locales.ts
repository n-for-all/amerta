import { DEFAULT_LOCALE } from "@/amerta/localization/locales";
import { Settings } from "@/payload-types";
import { getGlobal } from "@/amerta/utilities/getGlobals";
import { Config } from "payload";

export const filterAvailableLocales = async ({ locales }) => {
  try {
    const settings: Settings = await getGlobal("settings" as keyof Config["globals"], 1);
    const enabledCodes = settings.locales;
    if (!Array.isArray(enabledCodes) || enabledCodes.length === 0) return locales;

    return locales.filter((locale) => {
      const isEnabled = enabledCodes.includes(locale.code);
      const isDefault = locale.code === DEFAULT_LOCALE;

      return isEnabled || isDefault;
    });
  } catch (error) {
    console.error("Error filtering locales:", error);
    return locales;
  }
};
