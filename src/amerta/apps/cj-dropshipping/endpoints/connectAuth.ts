import { Endpoint, PayloadRequest } from "payload";
import { withGuard } from "@/amerta/utilities/withGuard";
import { CJClient } from "../services/cjClient";

export const connectAuthEndpoint: Endpoint = {
  path: "/cj-dropshipping/connect",
  method: "post",
  handler: withGuard(async (req: PayloadRequest) => {
    try {

      const body = req.json ? await req.json() : req.body;
      const { email, apiKey } = body || {};

      if (!email || !apiKey) {
        return Response.json({ error: "Email and API Key are required." }, { status: 400 });
      }

      // Test authentication against CJ Dropshipping API
      const authData = await CJClient.getAccessToken(email, apiKey);

      // Save credentials and token into Apps global
      const appsGlobal = await req.payload.findGlobal({ slug: "apps", depth: 0 });
      const currentAppSettings = (appsGlobal?.appSettings as Record<string, any>) || {};
      const existingCjSettings = currentAppSettings["cj-dropshipping"] || {};

      const updatedCjSettings = {
        ...existingCjSettings,
        email,
        apiKey,
        accessToken: authData.accessToken,
        tokenExpiryDate: authData.accessTokenExpiryDate,
      };

      await req.payload.updateGlobal({
        slug: "apps",
        data: {
          appSettings: {
            ...currentAppSettings,
            "cj-dropshipping": updatedCjSettings,
          },
        },
      });

      return Response.json({
        success: true,
        message: "Successfully connected to CJ Dropshipping!",
        tokenExpiryDate: authData.accessTokenExpiryDate,
      });
    } catch (err: any) {
      console.error("[CJ Auth Endpoint Error]:", err);
      return Response.json(
        {
          error: err.message || "Failed to authenticate with CJ Dropshipping.",
        },
        { status: 400 },
      );
    }
  }),
};
