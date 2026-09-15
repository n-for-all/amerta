import { Endpoint, PayloadRequest } from "payload";
import { withGuard } from "@/amerta/utilities/withGuard";
import { CJClient } from "../services/cjClient";
import { CJImporter } from "../services/cjImporter";
import { getAppSettings } from "@/amerta/core/utilities/get-app-settings";
import { CJSettings, parseCJWeight, resolveEffectiveProductWeight } from "../types";

export const productDetailsEndpoint: Endpoint = {
  path: "/cj-dropshipping/details",
  method: "get",
  handler: withGuard(async (req: PayloadRequest) => {
    try {

      const url = new URL(req.url || "", "http://localhost");
      const pid = url.searchParams.get("pid");

      if (!pid) {
        return Response.json({ error: "Product ID (pid) is required." }, { status: 400 });
      }

      const settings = (await getAppSettings("cj-dropshipping")) as CJSettings | undefined;
      const product = await CJClient.getProductDetails(pid);

      // Normalize images from productImage, productImageSet, and variants
      let imageList: string[] = [];
      if (Array.isArray(product.productImageSet)) {
        imageList = product.productImageSet;
      } else if (typeof product.productImageSet === "string" && (product.productImageSet as string).trim()) {
        try {
          const parsed = JSON.parse(product.productImageSet);
          if (Array.isArray(parsed)) {
            imageList = parsed;
          } else {
            imageList = [product.productImageSet];
          }
        } catch {
          imageList = (product.productImageSet as string).split(",").map((s) => s.trim()).filter(Boolean);
        }
      }

      if (product.productImage && !imageList.includes(product.productImage)) {
        imageList.unshift(product.productImage);
      }

      if (Array.isArray(product.variants)) {
        for (const v of product.variants) {
          if (v.variantImage && !imageList.includes(v.variantImage)) {
            imageList.push(v.variantImage);
          }
        }
      }

      const validImages = imageList.filter((img) => typeof img === "string" && img.startsWith("http"));
      const primaryImage = validImages[0] || product.productImage || "";

      // Resolve channel exchange rate
      const channelInfo = await CJImporter.getChannelExchangeRate(req.payload, settings?.defaultSalesChannelId);
      const exchangeRate = channelInfo.rate;

      // Resolve effective weight across parent fields and variants
      const resolvedWeight = resolveEffectiveProductWeight(product);

      // Evaluate shipping rules on the backend
      const ruleEval = CJImporter.evaluateShippingRules(
        {
          productWeight: resolvedWeight,
          sellPrice: product.sellPrice || (product.variants?.[0]?.variantSellPrice ?? 0),
          variantsCount: product.variants?.length || 0,
          variants: product.variants,
        },
        settings?.shippingImportRules
      );

      // Enhance variants with calculated retail prices in store currency, incorporating rule buffer
      const enhancedVariants = (product.variants || []).map((v) => {
        const cost = v.variantSellPrice || v.variantStandardPrice || 0;
        const { price } = CJImporter.calculatePrice(cost, settings, exchangeRate, ruleEval.bufferUSD);
        return {
          ...v,
          variantWeight: parseCJWeight(v.variantWeight || v.weight || resolvedWeight),
          calculatedRetailPrice: price,
        };
      });

      const rawDescription =
        (product as any).description ||
        (product as any).descriptionHtml ||
        (product as any).productDetail ||
        (product as any).productDescription ||
        (product as any).remark ||
        (product as any).detail ||
        "";

      return Response.json({
        success: true,
        currencyCode: channelInfo.currencyCode,
        currencySymbol: channelInfo.symbol,
        exchangeRate: channelInfo.rate,
        ruleEval: {
          allowed: ruleEval.allowed,
          blocked: !ruleEval.allowed,
          reason: ruleEval.reason,
          bufferUSD: ruleEval.bufferUSD,
          matchedRuleName: ruleEval.matchedRuleName,
        },
        product: {
          ...product,
          productWeight: resolvedWeight,
          description: rawDescription,
          productImage: primaryImage,
          productImageSet: validImages,
          variants: enhancedVariants,
        },
      });
    } catch (err: any) {
      console.error("[CJ Product Details Error]:", err);
      return Response.json(
        {
          error: err.message || "Failed to fetch CJ product details.",
        },
        { status: 400 },
      );
    }
  }),
};
