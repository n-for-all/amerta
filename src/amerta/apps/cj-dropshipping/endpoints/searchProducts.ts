import { Endpoint, PayloadRequest } from "payload";
import { withGuard } from "@/amerta/utilities/withGuard";
import { CJClient } from "../services/cjClient";
import { CJImporter } from "../services/cjImporter";
import { getAppSettings } from "@/amerta/core/utilities/get-app-settings";
import { CJSettings } from "../types";

export const searchProductsEndpoint: Endpoint = {
  path: "/cj-dropshipping/search",
  method: "get",
  handler: withGuard(async (req: PayloadRequest) => {
    try {

      const url = new URL(req.url || "", "http://localhost");
      const keyword = url.searchParams.get("keyword") || url.searchParams.get("keyWord") || url.searchParams.get("q") || "";
      const categoryId = url.searchParams.get("categoryId") || "";
      const pageNum = parseInt(url.searchParams.get("pageNum") || url.searchParams.get("page") || "1", 10);
      const pageSize = parseInt(url.searchParams.get("pageSize") || url.searchParams.get("size") || "24", 10);
      const startPrice = url.searchParams.get("startPrice") ? parseFloat(url.searchParams.get("startPrice")!) : undefined;
      const endPrice = url.searchParams.get("endPrice") ? parseFloat(url.searchParams.get("endPrice")!) : undefined;
      const countryCode = url.searchParams.get("countryCode") || "";
      const productFlag = url.searchParams.has("productFlag") && url.searchParams.get("productFlag") !== ""
        ? parseInt(url.searchParams.get("productFlag")!, 10)
        : undefined;
      const addMarkStatus = url.searchParams.has("addMarkStatus") && url.searchParams.get("addMarkStatus") !== ""
        ? parseInt(url.searchParams.get("addMarkStatus")!, 10)
        : undefined;
      const startWarehouseInventory = url.searchParams.get("startWarehouseInventory")
        ? parseInt(url.searchParams.get("startWarehouseInventory")!, 10)
        : undefined;
      const productType = url.searchParams.get("productType")
        ? parseInt(url.searchParams.get("productType")!, 10)
        : undefined;

      const settings = (await getAppSettings("cj-dropshipping")) as CJSettings | undefined;

      const results = await CJClient.searchProducts({
        keyword,
        categoryId,
        pageNum,
        pageSize,
        startPrice,
        endPrice,
        countryCode,
        productFlag,
        addMarkStatus,
        startWarehouseInventory,
        productType,
      });

      // Mark results that are already in the store. Imported products keep CJ's SKU, and their slug ends
      // with the last 6 characters of the CJ product id (see CJImporter.importProduct).
      const importedByPid = new Map<string, string>();
      if (results.list.length > 0) {
        const skus = results.list.map((i) => i.productSku).filter(Boolean);
        const existing = await req.payload.find({
          collection: "products",
          where: {
            or: [
              ...(skus.length ? [{ sku: { in: skus } }] : []),
              ...results.list.map((i) => ({ slug: { like: `-${i.pid.slice(-6).toLowerCase()}` } })),
            ],
          },
          limit: results.list.length * 2,
          depth: 0,
          pagination: false,
          select: { sku: true, slug: true },
        } as any);
        for (const item of results.list) {
          const suffix = `-${item.pid.slice(-6).toLowerCase()}`;
          const match = existing.docs.find(
            (d: any) => (item.productSku && d.sku === item.productSku) || (typeof d.slug === "string" && d.slug.endsWith(suffix)),
          );
          if (match) importedByPid.set(item.pid, String(match.id));
        }
      }

      // Resolve channel exchange rate
      const channelInfo = await CJImporter.getChannelExchangeRate(req.payload, settings?.defaultSalesChannelId);
      const exchangeRate = channelInfo.rate;

      // Enhance items with calculated retail pricing preview in store currency and evaluate shipping rules
      const enhancedList = results.list.map((item) => {
        const supplierPrice = parseFloat(item.sellPrice) || 0;

        // Evaluate dynamic shipping rules (controls allow/block & shipping buffer)
        const ruleEval = CJImporter.evaluateShippingRules(
          {
            productWeight: item.productWeight,
            weightPending: item.weightPending,
            sellPrice: item.sellPrice,
            variantsCount: item.variants?.length || 0,
            variants: item.variants,
          },
          settings?.shippingImportRules
        );

        const isBlocked = !ruleEval.allowed;
        const blockReason = ruleEval.reason;

        // Calculate retail price incorporating rule-assigned shipping buffer
        const { price } = CJImporter.calculatePrice(supplierPrice, settings, exchangeRate, ruleEval.bufferUSD);

        return {
          ...item,
          importedProductId: importedByPid.get(item.pid),
          calculatedRetailPrice: price,
          shippingBufferUSD: ruleEval.bufferUSD,
          matchedRuleName: ruleEval.matchedRuleName,
          importBlocked: isBlocked,
          importBlockedReason: blockReason,
        };
      });

      return Response.json({
        success: true,
        currencyCode: channelInfo.currencyCode,
        currencySymbol: channelInfo.symbol,
        exchangeRate: channelInfo.rate,
        total: results.total,
        pageNum: results.pageNum,
        pageSize: results.pageSize,
        products: enhancedList,
      });
    } catch (err: any) {
      console.error("[CJ Search Endpoint Error]:", err);
      return Response.json(
        {
          error: err.message || "Failed to search CJ catalog.",
        },
        { status: 400 },
      );
    }
  }),
};
