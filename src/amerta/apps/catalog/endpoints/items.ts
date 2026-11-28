import { Endpoint, PayloadRequest } from "payload";
import { DEFAULT_LOCALE, LOCALES } from "@/amerta/localization/locales";
import { getCatalogContext, getCatalogItemDetails, getCatalogItems } from "../services/catalogItems";

const localeOf = (req: PayloadRequest): string => {
  const wanted = String(req.query?.locale || "");
  return LOCALES.some((locale) => locale.code === wanted) ? wanted : DEFAULT_LOCALE;
};

/** The next page of the catalog, for loading more as the customer scrolls. */
export const catalogItemsEndpoint: Endpoint = {
  path: "/catalog/items",
  method: "get",
  handler: async (req: PayloadRequest) => {
    try {
      const ctx = await getCatalogContext(localeOf(req));
      if (!ctx) return Response.json({ error: "Not found" }, { status: 404 });
      const page = Math.max(1, parseInt(String(req.query?.page || "1"), 10) || 1);
      return Response.json(await getCatalogItems(ctx, page));
    } catch (error) {
      console.error("[Catalog] Items failed:", error);
      return Response.json({ error: "Could not load products" }, { status: 500 });
    }
  },
};

/** One product, for the popup. */
export const catalogItemEndpoint: Endpoint = {
  path: "/catalog/item/:id",
  method: "get",
  handler: async (req: PayloadRequest) => {
    try {
      const ctx = await getCatalogContext(localeOf(req));
      const id = String((req.routeParams as any)?.id || "");
      const item = ctx && /^[a-zA-Z0-9_-]{1,64}$/.test(id) ? await getCatalogItemDetails(ctx, id) : null;
      if (!item) return Response.json({ error: "Not found" }, { status: 404 });
      return Response.json(item);
    } catch (error) {
      console.error("[Catalog] Item failed:", error);
      return Response.json({ error: "Could not load the product" }, { status: 500 });
    }
  },
};
