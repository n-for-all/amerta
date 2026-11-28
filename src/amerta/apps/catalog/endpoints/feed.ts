import { Endpoint, PayloadRequest } from "payload";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import striptags from "striptags";
import { getProductsBy } from "@/amerta/core/utilities/get-product-by";
import { getSalesChannel } from "@/amerta/core/utilities/get-sales-channel";
import { getDefaultCurrency } from "@/amerta/core/utilities/get-default-currency";
import { getLocales } from "@/amerta/core/utilities/get-locales";
import { isInStock } from "@/amerta/core/utilities/is-in-stock";
import { hasStock } from "@/amerta/core/utilities/has-stock";
import { getServerSideURL, getURL } from "@/amerta/utilities/getURL";
import { DEFAULT_LOCALE } from "@/amerta/localization/locales";
import { CATALOG_SOURCES, getCatalogSettings } from "../settings";

const xml = (value: unknown): string =>
  String(value ?? "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const absoluteUrl = (url?: string | null): string => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return getServerSideURL() + (url.startsWith("/") ? "" : "/") + url;
};

const imageUrl = (image: any): string => (image && typeof image === "object" ? absoluteUrl(image.url) : "");

const plainText = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return striptags(value).replace(/\s+/g, " ").trim();
  if (typeof value === "object" && value.root) {
    try {
      return striptags(convertLexicalToHTML({ data: value }).replace(/<\/(p|li|h\d|div)>/g, " ")).replace(/\s+/g, " ").trim();
    } catch {
      return "";
    }
  }
  return "";
};

const tag = (name: string, value: unknown): string => (value === undefined || value === null || value === "" ? "" : `<${name}>${xml(value)}</${name}>`);

/**
 * Product feed in the RSS 2.0 format that Meta Commerce Manager reads (it feeds the Facebook,
 * Instagram and WhatsApp catalogs). Product links carry utm_source=catalog_feed, so an order
 * that starts from one of those catalogs records where it came from.
 */
export const catalogFeedEndpoint: Endpoint = {
  path: "/catalog/feed.xml",
  method: "get",
  handler: async (req: PayloadRequest) => {
    try {
      const { active, settings } = await getCatalogSettings(req.payload);
      if (!active || !settings.feedEnabled) {
        return new Response("Not found", { status: 404 });
      }

      const locales = await getLocales();
      const wanted = String(req.query?.locale || "");
      const locale = (locales as string[]).includes(wanted) ? wanted : DEFAULT_LOCALE;

      const salesChannel = await getSalesChannel();
      const defaultCurrency: any = getDefaultCurrency(salesChannel as any);
      const currencyCode = String((typeof defaultCurrency === "string" ? defaultCurrency : defaultCurrency?.code) || "").toUpperCase();
      if (!currencyCode) {
        return new Response("The sales channel has no default currency.", { status: 500 });
      }

      const siteSettings: any = await req.payload.findGlobal({ slug: "settings" as any, depth: 0, locale: locale as any }).catch(() => null);
      const siteTitle = siteSettings?.siteTitle || "";
      const money = (amount: number) => `${Number(amount).toFixed(2)} ${currencyCode}`;

      const items: string[] = [];
      let page = 1;
      let hasNextPage = true;
      while (hasNextPage && page <= 20) {
        const result: any = await getProductsBy({ locale, limit: 250, page, sortQuery: ["-createdAt"] });
        for (const product of result.docs) {
          if (!product.title) continue;

          const slug = product.slug || product.id;
          const link = `${getURL(`/product/${slug}`, locale)}?utm_source=${CATALOG_SOURCES.feed}&utm_medium=product_feed`;
          const images = ((product.images || []) as any[]).map(imageUrl).filter(Boolean);
          const description = plainText(product.excerpt) || plainText(product.description) || product.meta?.description || product.title;
          const brand = (typeof product.brand === "object" && product.brand?.title) || siteTitle;

          const entry = (fields: { id: string; price: number; salePrice?: number | null; image?: string; inStock: boolean; groupId?: string }) => {
            if (!fields.price || !(fields.image || images[0])) return;
            const onSale = !!fields.salePrice && fields.salePrice > 0 && fields.salePrice < fields.price;
            items.push(
              [
                "<item>",
                tag("g:id", fields.id),
                tag("g:title", product.title),
                tag("g:description", description.slice(0, 5000)),
                tag("g:link", link),
                tag("g:image_link", fields.image || images[0]),
                ...images.filter((url) => url !== (fields.image || images[0])).slice(0, 10).map((url) => tag("g:additional_image_link", url)),
                tag("g:availability", fields.inStock ? "in stock" : "out of stock"),
                tag("g:condition", "new"),
                tag("g:price", money(fields.price)),
                onSale ? tag("g:sale_price", money(fields.salePrice!)) : "",
                tag("g:brand", brand),
                tag("g:item_group_id", fields.groupId),
                "</item>",
              ]
                .filter(Boolean)
                .join(""),
            );
          };

          if (product.type === "variant" && product.variants?.length) {
            product.variants.forEach((variant: any, index: number) => {
              const variantOptions = Object.keys(variant.variant || {}).map((option) => ({ option, value: variant.variant[option]?.value }));
              entry({
                id: variant.sku || `${product.id}-${index}`,
                price: variant.price,
                salePrice: variant.salePrice,
                image: imageUrl(variant.image) || undefined,
                inStock: isInStock(product, variantOptions, 1),
                groupId: String(product.id),
              });
            });
          } else {
            entry({ id: product.sku || String(product.id), price: product.price, salePrice: product.salePrice, inStock: hasStock(product) });
          }
        }
        hasNextPage = !!result.hasNextPage;
        page++;
      }

      const body =
        `<?xml version="1.0" encoding="UTF-8"?>` +
        `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>` +
        tag("title", settings.heading || siteTitle || "Catalog") +
        tag("link", getURL("/catalog", locale)) +
        tag("description", settings.intro || `${siteTitle} catalog`.trim()) +
        items.join("") +
        `</channel></rss>`;

      return new Response(body, {
        headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=900" },
      });
    } catch (error: any) {
      console.error("[Catalog] Feed failed:", error);
      return new Response("Feed could not be generated.", { status: 500 });
    }
  },
};
