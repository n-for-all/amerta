import { Endpoint, PayloadRequest } from "payload";
import { withGuard } from "@/amerta/utilities/withGuard";
import { getLoyaltySettings, DEFAULT_LOYALTY_SETTINGS } from "../services/loyaltyEngine";

export const getLoyaltySettingsEndpoint: Endpoint = {
  path: "/loyalty/settings",
  method: "get",
  handler: async (req: PayloadRequest) => {
    try {
      const settings = await getLoyaltySettings(req.payload);
      return Response.json(settings);
    } catch (err: any) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  },
};

export const updateLoyaltySettingsEndpoint: Endpoint = {
  path: "/loyalty/settings",
  method: "post",
  handler: withGuard(async (req: PayloadRequest) => {
    try {
      const body = req.json ? await req.json() : req.body;
      const appsGlobal = await req.payload.findGlobal({ slug: "apps", depth: 0 });
      const currentAppSettings = (appsGlobal?.appSettings as Record<string, any>) || {};

      const updatedSettings = {
        ...DEFAULT_LOYALTY_SETTINGS,
        ...(currentAppSettings.loyalty || {}),
        ...body,
      };

      await req.payload.updateGlobal({
        slug: "apps",
        data: {
          appSettings: {
            ...currentAppSettings,
            loyalty: updatedSettings,
          },
        },
      });

      return Response.json({
        success: true,
        settings: updatedSettings,
      });
    } catch (err: any) {
      return Response.json({ error: err.message }, { status: 500 });
    }
  }),
};
