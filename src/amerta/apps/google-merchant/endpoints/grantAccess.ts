import { Endpoint } from "payload";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { GoogleAuth } from "google-auth-library";

export const grantAccessEndpoint: Endpoint = {
  path: "/google-merchant/grant-access",
  method: "post",
  handler: async (req) => {
    try {
      if (!req.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const payload = await getPayload({ config: configPromise });
      const appsGlobal = await payload.findGlobal({
        slug: "apps",
        depth: 0,
      });

      const config = appsGlobal?.appSettings?.["google-merchant"];

      if (!config || !config.merchantId || !config.serviceAccountJson) {
        return Response.json({ error: "Google Merchant is not configured. Please save your Merchant ID and Service Account JSON first." }, { status: 400 });
      }

      let credentials;
      try {
        credentials = JSON.parse(config.serviceAccountJson);
      } catch (e) {
        return Response.json({ error: "Invalid Service Account JSON" }, { status: 400 });
      }

      if (!credentials.client_email) {
        return Response.json({ error: "Service Account JSON is missing client_email" }, { status: 400 });
      }

      let requestBody;
      try {
        requestBody = await req.json!();
      } catch (e) {
        requestBody = {};
      }

      const developerEmail = requestBody.developerEmail || credentials.client_email;
      const targetMerchantId = requestBody.merchantId || config.merchantId;

      const auth = new GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/content'],
      });

      const client = await auth.getClient();
      const token = await client.getAccessToken();

      const res = await fetch(`https://merchantapi.googleapis.com/accounts/v1/accounts/${targetMerchantId}/users/${developerEmail}?updateMask=accessRights`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessRights: [
            "ADMIN",
            "API_DEVELOPER"
          ]
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || JSON.stringify(data));
      }

      return Response.json({ success: true, data });
    } catch (error: any) {
      console.error("Error granting Google Merchant access:", error);
      return Response.json({ error: error.message || "Failed to grant access rights" }, { status: 500 });
    }
  },
};
