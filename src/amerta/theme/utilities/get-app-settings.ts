import { getPayload } from "payload";
import configPromise from "@payload-config";

export const getAppSettings = async (appSlug?: string) => {
  const payload = await getPayload({ config: configPromise });
  const appsGlobal = await payload.findGlobal({
    slug: "apps",
    depth: 0,
  });

  const settings = appsGlobal?.appSettings || {};
  if (appSlug) {
    return settings[appSlug];
  }
  return settings;
};
