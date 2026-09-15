import { Endpoint, PayloadRequest } from "payload";
import { withGuard } from "@/amerta/utilities/withGuard";
import { CJClient } from "../services/cjClient";

export const calculateShippingEndpoint: Endpoint = {
  path: "/cj-dropshipping/shipping",
  method: "post",
  handler: withGuard(async (req: PayloadRequest) => {
    try {

      const body = req.json ? await req.json() : req.body;
      const { pid, vid, countryCode = "US", startCountryCode = "CN", quantity = 1 } = body || {};

      if (!pid && !vid) {
        return Response.json({ error: "Please provide either 'pid' or 'vid'." }, { status: 400 });
      }

      const rawOptions = await CJClient.calculateFreight({
        startCountryCode,
        endCountryCode: countryCode,
        pid,
        vid,
        quantity,
      });

      // Normalize shipping options
      const normalizedOptions = rawOptions.map((opt: any) => {
        return {
          name: opt.logisticName || opt.name || "Standard Shipping",
          price: Number(opt.logisticPrice ?? opt.price ?? 0),
          currency: opt.currency || "USD",
          aging: opt.logisticAging || opt.aging || opt.time || "7-15 days",
          trackingType: opt.trackingType || opt.trackType || "Full tracking",
        };
      }).filter((opt: any) => opt.price > 0);

      // Sort by price ascending
      normalizedOptions.sort((a: any, b: any) => a.price - b.price);

      return Response.json({
        success: true,
        countryCode,
        options: normalizedOptions,
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
