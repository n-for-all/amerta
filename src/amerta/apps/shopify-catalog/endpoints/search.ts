import { Endpoint, PayloadRequest } from "payload";
import { withGuard } from "@/amerta/utilities/withGuard";
import { callCatalog, getCatalogSettings } from "../services/catalog";

const minor = (v: any) => (v === "" || v === undefined || v === null || isNaN(Number(v)) ? undefined : Math.round(Number(v) * 100));

export const searchCatalogEndpoint: Endpoint = {
  path: "/shopify-catalog/search",
  method: "post",
  handler: withGuard(async (req: PayloadRequest) => {
    try {
      const body: any = (await req.json?.()) || {};
      const settings = await getCatalogSettings(req.payload);

      const country = (body.country || settings.country || "").toUpperCase() || undefined;
      const currency = (body.currency || settings.currency || "").toUpperCase() || undefined;
      const min = minor(body.minPrice);
      const max = minor(body.maxPrice);

      const filters: Record<string, any> = {
        ...((min !== undefined || max !== undefined) && { price: { ...(min !== undefined && { min }), ...(max !== undefined && { max }) } }),
        ...(body.shipsTo && { ships_to: { country: String(body.shipsTo).toUpperCase() } }),
        ...(body.shops && { shops: String(body.shops).split(/[\s,]+/).filter(Boolean) }),
      };

      const catalog: Record<string, any> = {
        ...(body.query && { query: body.query }),
        ...(settings.catalogId && body.useCatalog !== false && { catalog_id: settings.catalogId }),
        context: { ...(country && { address_country: country }), ...(currency && { currency }), ...(body.intent && { intent: body.intent }) },
        ...(Object.keys(filters).length && { filters }),
        pagination: { limit: Math.min(Math.max(Number(body.limit) || 12, 1), 50), ...(body.cursor && { cursor: body.cursor }) },
      };

      const result = await callCatalog(settings, "search_catalog", catalog);
      return Response.json({ ...result, catalogId: catalog.catalog_id || null });
    } catch (error: any) {
      return Response.json({ error: error.message || "Search failed" }, { status: 500 });
    }
  }),
};
