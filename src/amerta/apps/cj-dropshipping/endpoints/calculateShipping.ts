import { Endpoint, PayloadRequest } from "payload";
import { withGuard } from "@/amerta/utilities/withGuard";
import { CJClient } from "../services/cjClient";

export const calculateShippingEndpoint: Endpoint = {
  path: "/cj-dropshipping/shipping",
  method: "post",
  handler: withGuard(async (req: PayloadRequest) => {
    try {

      const body = req.json ? await req.json() : req.body;
      const { pid, vid, countryCode = "US", startCountryCode, quantity = 1 } = body || {};

      if (!pid && !vid) {
        return Response.json({ error: "Please provide either 'pid' or 'vid'." }, { status: 400 });
      }

      // Ship from the warehouses that actually hold stock (a US-only product can't ship from CN).
      // An explicit startCountryCode overrides; with no inventory data, fall back to CN.
      let origins: { countryCode: string; areaEn: string }[] = [];
      if (startCountryCode) {
        origins = [{ countryCode: startCountryCode, areaEn: startCountryCode }];
      } else if (pid) {
        try {
          origins = (await CJClient.getStockCountries(pid)).slice(0, 3);
        } catch (err) {
          console.warn("[CJ Shipping] Could not load stock warehouses, falling back to CN:", err);
        }
      }
      if (origins.length === 0) {
        origins = [{ countryCode: "CN", areaEn: "China Warehouse" }];
      }

      const normalizedOptions: any[] = [];
      const errors: string[] = [];

      for (const origin of origins) {
        try {
          const rawOptions = await CJClient.calculateFreight({
            startCountryCode: origin.countryCode,
            endCountryCode: countryCode,
            pid,
            vid,
            quantity,
          });

          for (const opt of rawOptions) {
            const price = Number(opt.logisticPrice ?? opt.price ?? 0);
            if (!(price > 0)) continue;
            normalizedOptions.push({
              name: opt.logisticName || opt.name || "Standard Shipping",
              price,
              currency: opt.currency || "USD",
              aging: opt.logisticAging || opt.aging || opt.time || "7-15 days",
              trackingType: opt.trackingType || opt.trackType || "Full tracking",
              origin: origin.countryCode,
              originName: origin.areaEn,
            });
          }
        } catch (err: any) {
          errors.push(`${origin.countryCode}: ${err.message}`);
        }
      }

      // Sort by price ascending
      normalizedOptions.sort((a: any, b: any) => a.price - b.price);

      return Response.json({
        success: true,
        countryCode,
        stockOrigins: origins.map((o) => o.countryCode),
        options: normalizedOptions,
        ...(errors.length ? { originErrors: errors } : {}),
      });
    } catch (err: any) {
      console.error("[CJ Shipping Calculate Error]:", err);
      return Response.json(
        {
          error: err.message || "Failed to calculate shipping rates.",
        },
        { status: 400 },
      );
    }
  }),
};
