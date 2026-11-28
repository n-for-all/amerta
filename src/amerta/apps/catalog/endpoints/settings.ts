import { Endpoint, PayloadRequest } from "payload";
import { withGuard } from "@/amerta/utilities/withGuard";
import { DEFAULT_CATALOG_SETTINGS, getCatalogSettings, whatsappDigits } from "../settings";

export const getCatalogSettingsEndpoint: Endpoint = {
  path: "/catalog/settings",
  method: "get",
  handler: withGuard(async (req: PayloadRequest) => {
    const { settings } = await getCatalogSettings(req.payload);
    return Response.json(settings);
  }),
};

export const updateCatalogSettingsEndpoint: Endpoint = {
  path: "/catalog/settings",
  method: "post",
  handler: withGuard(async (req: PayloadRequest) => {
    try {
      const body = (await req.json!()) || {};
      const appsGlobal = await req.payload.findGlobal({ slug: "apps", depth: 0 });
      const currentAppSettings = (appsGlobal?.appSettings as Record<string, any>) || {};

      // Keep only known settings, with the right types
      const settings = { ...DEFAULT_CATALOG_SETTINGS, ...(currentAppSettings.catalog || {}) };
      for (const key of Object.keys(DEFAULT_CATALOG_SETTINGS)) {
        if (!(key in body)) continue;
        settings[key] = typeof DEFAULT_CATALOG_SETTINGS[key] === "boolean" ? Boolean(body[key]) : String(body[key] ?? "").trim();
      }
      settings.whatsappNumber = whatsappDigits(settings.whatsappNumber);

      await req.payload.updateGlobal({
        slug: "apps",
        data: { appSettings: { ...currentAppSettings, catalog: settings } },
      });

      return Response.json({ success: true, settings });
    } catch (err: any) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }),
};
