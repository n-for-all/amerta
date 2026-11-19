import { Endpoint, PayloadRequest } from "payload";
import { withGuard } from "@/amerta/utilities/withGuard";
import { callCatalog, getCatalogSettings } from "../services/catalog";

// Full product: every image, all variants with their own links, description and highlights
export const productDetailsEndpoint: Endpoint = {
  path: "/shopify-catalog/product",
  method: "post",
  handler: withGuard(async (req: PayloadRequest) => {
    try {
      const body: any = (await req.json?.()) || {};
      if (!body.id) return Response.json({ error: "Missing product id" }, { status: 400 });
      const settings = await getCatalogSettings(req.payload);

      const country = (body.country || settings.country || "").toUpperCase() || undefined;
      const currency = (body.currency || settings.currency || "").toUpperCase() || undefined;

      const result = await callCatalog(settings, "get_product", {
        id: body.id,
        // Same catalog as the search, so the variant links keep its attribution
        ...(settings.catalogId && body.useCatalog !== false && { catalog_id: settings.catalogId }),
        context: { ...(country && { address_country: country }), ...(currency && { currency }) },
      });
      if (!result.product) return Response.json({ error: result.messages?.[0]?.content || "Product not found" }, { status: 404 });
      return Response.json(result);
    } catch (error: any) {
      return Response.json({ error: error.message || "Failed to load product" }, { status: 500 });
    }
  }),
};
