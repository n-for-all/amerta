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
        const fallback = DEFAULT_CATALOG_SETTINGS[key];
        if (Array.isArray(fallback)) settings[key] = Array.isArray(body[key]) ? body[key].map(String).slice(0, 2000) : [];
        else if (typeof fallback === "boolean") settings[key] = Boolean(body[key]);
        else settings[key] = String(body[key] ?? "").trim();
      }
      settings.orderMode = settings.orderMode === "add_to_cart" ? "add_to_cart" : "buy_now";
      settings.productMode = settings.productMode === "selected" ? "selected" : "all";
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
