import { Endpoint } from "payload";
import { DataSourcesServiceClient } from "@google-shopping/datasources";
import { getPayload } from "payload";
import configPromise from "@payload-config";

export const fetchSourcesEndpoint: Endpoint = {
  path: "/google-merchant/sources",
  method: "get",
  handler: async (req) => {
    try {
      if (!req.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      const payload = await getPayload({ config: configPromise });
      // Fetch the global apps config
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

      const client = new DataSourcesServiceClient({
        credentials,
      });

      const [sources] = await client.listDataSources({
        parent: `accounts/${config.merchantId}`,
      });

      const formattedSources = sources.map((s: any) => ({
        dataSourceId: s.dataSourceId || s.name?.split('/').pop(),
        displayName: s.displayName,
      }));

      return Response.json({ sources: formattedSources });
    } catch (error: any) {
      console.error("Error fetching Google Merchant sources:", error);
      return Response.json({ error: error.message || "Failed to fetch sources" }, { status: 500 });
    }
  },
};
