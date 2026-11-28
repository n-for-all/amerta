import { getPayload } from "payload";
import configPromise from "@payload-config";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import { Product } from "@/payload-types";
import { getSalesChannel } from "@/amerta/core/utilities/get-sales-channel";
import { getCurrentCurrency } from "@/amerta/core/utilities/get-current-currency";
import { getDefaultCurrency } from "@/amerta/core/utilities/get-default-currency";
import { getExchangeRate } from "@/amerta/core/utilities/get-exchange-rate";
import { getProductPricing } from "@/amerta/core/utilities/get-product-pricing";
import { formatPrice } from "@/amerta/core/utilities/format-price";
import { hasStock } from "@/amerta/core/utilities/has-stock";
import { isInStock } from "@/amerta/core/utilities/is-in-stock";
import { createTranslator } from "@/amerta/core/utilities/translation";
import { getURL } from "@/amerta/utilities/getURL";
import { LocaleCode } from "@/amerta/localization/locales";
import { CATALOG_SOURCES, CatalogSettings, getCatalogSettings, whatsappDigits } from "../settings";

export const CATALOG_PAGE_SIZE = 12;

export interface CatalogItem {
  id: string;
  title: string;
  excerpt: string;
  image: string | null;
  productUrl: string;
  priceLabel: string;
  compareLabel: string | null;
  fromPrice: boolean;
  inStock: boolean;
  /** simple = order in one tap, variant = pick a variant in the popup, choices = pick on the product page */
  kind: "simple" | "variant" | "choices";
  whatsappUrl: string;
  /** Collection heading this product is listed under ("" = none) */
  section: string;
}

export interface CatalogVariant {
  label: string;
  variantOptions: { option: string; value: string }[];
  priceLabel: string;
  compareLabel: string | null;
  inStock: boolean;
  whatsappUrl: string;
  image: string | null;
}

export interface CatalogItemDetails extends CatalogItem {
  images: string[];
  descriptionHtml: string;
  variants: CatalogVariant[];
}

const imageUrl = (image: any): string | null => (image && typeof image === "object" && image.url ? image.url : null);

/** The products the catalog may show: published, sold on their own, in this sales channel, and chosen in the settings. */
export const catalogWhere = (settings: CatalogSettings, salesChannelId: string) => ({
  and: [
    { salesChannels: { in: [salesChannelId] } },
    { notSoldSeparately: { not_equals: true } },
    { _status: { equals: "published" } },
    ...(settings.productMode === "selected" ? [{ id: { in: settings.productIds.length ? settings.productIds : ["000000000000000000000000"] } }] : []),
  ],
});

export async function getCatalogContext(locale: string) {
  const payload = await getPayload({ config: configPromise });
  const { active, settings } = await getCatalogSettings(payload);
  if (!active) return null;

  const salesChannel = await getSalesChannel();
  const currency = await getCurrentCurrency(salesChannel);
  const exchangeRate = Number(getExchangeRate(getDefaultCurrency(salesChannel), currency, salesChannel) || 1);
  const __ = await createTranslator(locale);
  const whatsappNumber = settings.orderOnWhatsapp ? whatsappDigits(settings.whatsappNumber) : "";

  const money = (amount: number) => formatPrice(amount, currency, exchangeRate);
  // Plain "130.00 AED": currency symbols from custom fonts do not show in WhatsApp
  const plainMoney = (amount: number) => `${(amount * exchangeRate).toFixed(2)} ${(currency?.code || "").toUpperCase()}`.trim();
  // The message names the product and links back to it, tagged so the order shows it came from the catalog
  const whatsappUrl = (title: string, amount: number, productUrl: string) =>
    whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent([settings.whatsappMessage, title, plainMoney(amount), `${productUrl}?utm_source=${CATALOG_SOURCES.whatsapp}`].filter(Boolean).join("\n"))}` : "";

  return { payload, settings, salesChannel, currency, locale, __, money, whatsappUrl };
}

type Context = NonNullable<Awaited<ReturnType<typeof getCatalogContext>>>;

const toItem = (product: Product, section: string, ctx: Context): CatalogItem => {
  const productUrl = getURL(`/product/${product.slug || product.id}`, ctx.locale);
  const pricing = getProductPricing(product, ctx.currency);
  const price = pricing?.type === "variant" ? pricing.minPrice || 0 : pricing?.price || 0;
  const salePrice = pricing?.type === "simple" && pricing.salePrice && pricing.salePrice < pricing.price ? pricing.salePrice : null;
  const pickedByCustomer = product.type === "bundle" && (product.bundleChoices || []).length > 0;

  return {
    id: String(product.id),
    title: product.title || "",
    excerpt: product.excerpt || "",
    image: imageUrl(product.images?.[0]),
    productUrl,
    priceLabel: ctx.money(salePrice || price),
    compareLabel: salePrice ? ctx.money(price) : null,
    fromPrice: pricing?.type === "variant" && pricing.minPrice !== pricing.maxPrice,
    inStock: hasStock(product),
    kind: product.type === "variant" ? "variant" : pickedByCustomer ? "choices" : "simple",
    whatsappUrl: ctx.whatsappUrl(product.title || "", salePrice || price, productUrl),
    section,
  };
};

/**
 * One page of the catalog. Products are grouped by collection (in the collections' order), each
 * product under the first collection it belongs to; the rest follow under "More products".
 */
export async function getCatalogItems(ctx: Context, page = 1): Promise<{ items: CatalogItem[]; hasMore: boolean; total: number }> {
  const { payload, settings, salesChannel, locale, __ } = ctx;

  const [all, collections] = await Promise.all([
    payload.find({ collection: "products", where: catalogWhere(settings, salesChannel.id) as any, depth: 0, pagination: false, limit: 5000, sort: "-createdAt", select: { collections: true } as any }),
    payload.find({ collection: "collections", where: { _status: { equals: "published" } }, depth: 0, limit: 200, sort: "title", locale: locale as LocaleCode, select: { title: true } as any }),
  ]);

  const placed = new Set<string>();
  const ordered: { id: string; section: string }[] = [];
  for (const collection of collections.docs as any[]) {
    for (const product of all.docs as any[]) {
      const ids = ((product.collections || []) as any[]).map((c) => String(typeof c === "object" ? c?.id : c));
      if (!placed.has(String(product.id)) && ids.includes(String(collection.id))) {
        placed.add(String(product.id));
        ordered.push({ id: String(product.id), section: collection.title || "" });
      }
    }
  }
  const grouped = ordered.length > 0;
  for (const product of all.docs as any[]) {
    if (!placed.has(String(product.id))) ordered.push({ id: String(product.id), section: grouped ? __("More products") : "" });
  }

  const start = (Math.max(1, page) - 1) * CATALOG_PAGE_SIZE;
  const slice = ordered.slice(start, start + CATALOG_PAGE_SIZE);
  if (slice.length === 0) return { items: [], hasMore: false, total: ordered.length };

  const docs = await payload.find({ collection: "products", where: { id: { in: slice.map((entry) => entry.id) } }, depth: 1, limit: slice.length, locale: locale as LocaleCode });
  const byId = new Map((docs.docs as Product[]).map((product) => [String(product.id), product]));

  return {
    items: slice.filter((entry) => byId.has(entry.id)).map((entry) => toItem(byId.get(entry.id)!, entry.section, ctx)),
    hasMore: start + CATALOG_PAGE_SIZE < ordered.length,
    total: ordered.length,
  };
}

/** Everything the product popup shows. */
export async function getCatalogItemDetails(ctx: Context, id: string): Promise<CatalogItemDetails | null> {
  const { payload, settings, salesChannel, locale } = ctx;
  const result = await payload.find({ collection: "products", where: { and: [...catalogWhere(settings, salesChannel.id).and, { id: { equals: id } }] } as any, depth: 1, limit: 1, locale: locale as LocaleCode });
  const product = result.docs[0] as Product | undefined;
  if (!product) return null;

  const item = toItem(product, "", ctx);
  let descriptionHtml = "";
  try {
    const description: any = (product as any).description;
    if (description?.root) descriptionHtml = convertLexicalToHTML({ data: description });
  } catch {
    descriptionHtml = "";
  }

  const variants: CatalogVariant[] =
    product.type === "variant"
      ? (product.variants || [])
          .filter((variant) => variant.price > 0 && variant.variant && Object.keys(variant.variant).length > 0)
          .map((variant) => {
            const variantOptions = Object.keys(variant.variant).map((option) => ({ option, value: variant.variant[option]!.value }));
            const onSale = !!variant.salePrice && variant.salePrice > 0 && variant.salePrice < variant.price;
            const price = onSale ? variant.salePrice! : variant.price;
            const label = Object.values(variant.variant).map((value) => value.value).join(" / ");
            return {
              label,
              variantOptions,
              priceLabel: ctx.money(price),
              compareLabel: onSale ? ctx.money(variant.price) : null,
              inStock: isInStock(product, variantOptions, 1),
              whatsappUrl: ctx.whatsappUrl(`${product.title} (${label})`, price, item.productUrl),
              image: imageUrl(variant.image),
            };
          })
      : [];

  return {
    ...item,
    images: ((product.images || []) as any[]).map(imageUrl).filter((url): url is string => !!url),
    descriptionHtml,
    variants,
  };
}
