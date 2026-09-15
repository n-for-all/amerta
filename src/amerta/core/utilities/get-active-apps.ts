import { getPayload } from "payload";
import configPromise from "@payload-config";

export const getActiveApps = async (): Promise<string[]> => {
  try {
    const payload = await getPayload({ config: configPromise });
    const appsGlobal = await payload.findGlobal({
      slug: "apps",
      depth: 0,
    });
    return (appsGlobal?.activeApps as string[]) || [];
  } catch (err) {
    return [];
  }
};
