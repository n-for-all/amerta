import { Settings } from "@/payload-types";
import { GTM as GTMClient } from "./GTM.client";
import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import { Config } from "payload";

export const GTM = async () => {
  const settings: Settings = await getCachedGlobal("settings" as keyof Config["globals"], 1)();
  if (!settings.gtagEnabled || !settings.gtagId) return null;
  const GA_ID = settings.gtagId;

  return (
    <>
      <GTMClient gtmId={GA_ID} withConsent={!!settings.gtagConsentEnabled} />
    </>
  );
};
