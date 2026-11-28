import { Endpoint, PayloadRequest } from "payload";
import z from "zod";
import { getCart } from "@/amerta/core/utilities/get-cart";
import { createCartIfNotExists } from "@/amerta/core/utilities/create-cart-if-not-exists";
import { getAllProductOptions } from "@/amerta/core/utilities/get-product-options";
import { getProductPrice } from "@/amerta/core/utilities/get-product-price";
import { isInStock } from "@/amerta/core/utilities/is-in-stock";
import { createTranslator } from "@/amerta/core/utilities/translation";
import { DEFAULT_LOCALE } from "@/amerta/localization/locales";
import { CATALOG_SOURCES, SOURCE_COOKIE, SOURCE_MAX_AGE, getCatalogSettings } from "../settings";

const buyNowSchema = z.object({
  product: z.string().min(1),
  quantity: z.number().int().positive().max(99).optional().default(1),
  variantOptions: z.array(z.object({ option: z.string(), value: z.string() })).optional(),
  locale: z.string().optional(),
});

const readCookie = (req: PayloadRequest, name: string): string | null => {
  const header = req.headers.get("cookie") || "";
  const match = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
};

/**
 * Buy now: the cart becomes this one product, so the customer goes straight to checkout
 * with nothing else in the way. The visit is tagged so the order records it came from the catalog.
 */
export const buyNowEndpoint: Endpoint = {
  path: "/catalog/buy-now",
  method: "post",
  handler: async (req: PayloadRequest) => {
    let __ = (text: string) => text;
    try {
      const body = await req.json!();
      __ = await createTranslator(body?.locale || DEFAULT_LOCALE);

      const { active, settings } = await getCatalogSettings(req.payload);
      if (!active || !settings.buyOnWebsite) {
        return Response.json({ error: __("Buying from the catalog is not available") }, { status: 404 });
      }

      const validation = buyNowSchema.safeParse(body);
      if (!validation.success) {
        return Response.json({ error: __("Error adding item to cart") }, { status: 400 });
      }
      const { product, quantity, variantOptions, locale } = validation.data;

      const productDoc = await req.payload.findByID({ collection: "products", id: product }).catch(() => null);
      if (!productDoc || productDoc._status !== "published" || productDoc.notSoldSeparately) {
        return Response.json({ error: __("Product not found") }, { status: 404 });
      }

      // Variant products without a chosen variant, and bundles where the customer picks items, need the product page
      const pickedByCustomer = productDoc.type === "bundle" && (productDoc.bundleChoices || []).length > 0;
      if (pickedByCustomer || (productDoc.type === "variant" && !variantOptions?.length)) {
        return Response.json({ error: __("Please choose your options on the product page"), needsOptions: true }, { status: 400 });
      }

      if (!isInStock(productDoc, variantOptions, quantity, [])) {
        return Response.json({ error: __("Out of Stock") }, { status: 400 });
      }

      const pricing = getProductPrice(productDoc, variantOptions, await getAllProductOptions());
      if (!pricing.price) {
        return Response.json({ error: __("Out of Stock") }, { status: 400 });
      }

      const cart = await getCart(readCookie(req, "cartId"), locale);
      await createCartIfNotExists(cart.id);
      const updated = await req.payload.update({
        collection: "cart",
        where: { cartId: { equals: cart.id } },
        data: {
          items: [{ product: productDoc.id, price: pricing.price, salePrice: pricing.salePrice, quantity, variantOptions: variantOptions || [], bundleChoices: [] }],
          status: "active",
        },
      });
      if (updated.errors.length > 0) {
        throw new Error(updated.errors.map((err) => err.message).join(", "));
      }

      const headers = new Headers({ "Content-Type": "application/json" });
      headers.append("Set-Cookie", `cartId=${cart.id}; Path=/; HttpOnly; SameSite=Strict`);
      headers.append("Set-Cookie", `${SOURCE_COOKIE}=${CATALOG_SOURCES.page}; Path=/; Max-Age=${SOURCE_MAX_AGE}; SameSite=Lax`);
      return new Response(JSON.stringify({ success: true }), { headers });
    } catch (error: any) {
      console.error("[Catalog] Buy now failed:", error);
      return Response.json({ error: __("Error adding item to cart") }, { status: 500 });
    }
  },
};
