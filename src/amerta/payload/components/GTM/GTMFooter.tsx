import { Settings } from "@/payload-types";
import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import { Config } from "payload";
import { CookieConsent } from "./cookies/CookieConsent";
import { getURL } from "@/amerta/utilities/getURL";

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const GTMFooter = async ({ locale }) => {
  const settings: Settings = await getCachedGlobal("settings" as keyof Config["globals"], 1, locale)();
  if (!settings.gtagEnabled || !settings.gtagId || !settings.gtagConsentEnabled) return null;

  const slug = typeof settings.consentPrivacyPolicy === "string" ? settings.consentPrivacyPolicy : settings.consentPrivacyPolicy?.slug;
  const privacyUrl = getURL(`/${slug}`, locale);
  return (
    <>
      <CookieConsent privacyUrl={privacyUrl} />
    </>
  );
};
