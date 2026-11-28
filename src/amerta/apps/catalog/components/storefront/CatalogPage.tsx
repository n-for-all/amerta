import { notFound } from "next/navigation";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { Product } from "@/payload-types";
import { getCollections } from "@/amerta/core/utilities/get-collections";
import { getProductsBy } from "@/amerta/core/utilities/get-product-by";
import { getSalesChannel } from "@/amerta/core/utilities/get-sales-channel";
import { getCurrentCurrency } from "@/amerta/core/utilities/get-current-currency";
import { getDefaultCurrency } from "@/amerta/core/utilities/get-default-currency";
import { getExchangeRate } from "@/amerta/core/utilities/get-exchange-rate";
import { getProductPricing } from "@/amerta/core/utilities/get-product-pricing";
import { formatPrice } from "@/amerta/core/utilities/format-price";
import { hasStock } from "@/amerta/core/utilities/has-stock";
import { createTranslator } from "@/amerta/core/utilities/translation";
import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import { getURL } from "@/amerta/utilities/getURL";
import { ImageOrPlaceholder } from "@/amerta/theme/components/Thumbnail";
import { CATALOG_SOURCES, getCatalogSettings, whatsappDigits } from "../../settings";
import { CatalogActions, CatalogSourceTag } from "./CatalogActions";

const PER_PAGE = 24;
/** Products shown per collection on the catalog's first screen */
const PREVIEW = 3;
const ALL = "all";

export async function getCatalogHeading(locale: string): Promise<string | null> {
  const payload = await getPayload({ config: configPromise });
  const { active, settings } = await getCatalogSettings(payload);
  if (!active) return null;
  const siteSettings: any = await getCachedGlobal("settings" as never, 1, locale)();
  return settings.heading || siteSettings?.siteTitle || "Catalog";
}

/**
 * The catalog reads like a menu: a cover with the shop's name, then one section per collection,
 * each product a row with its picture, name, short description, price and the order buttons.
 * "See all" (?collection=slug) lists one collection in full.
 */
export async function CatalogPage({ locale, page = 1, collection: collectionSlug }: { locale: string; page?: number; collection?: string }) {
  const payload = await getPayload({ config: configPromise });
  const { active, settings } = await getCatalogSettings(payload);
  if (!active) notFound();

  const __ = await createTranslator(locale);
  const siteSettings: any = await getCachedGlobal("settings" as never, 1, locale)();
  const headerData: any = await getCachedGlobal("header" as never, 1, locale)();
  const salesChannel = await getSalesChannel();
  const currency = await getCurrentCurrency(salesChannel);
  const exchangeRate = Number(getExchangeRate(getDefaultCurrency(salesChannel), currency, salesChannel) || 1);

  const whatsappNumber = settings.orderOnWhatsapp ? whatsappDigits(settings.whatsappNumber) : "";
  const heading = settings.heading || siteSettings?.siteTitle || __("Catalog");
  const catalogUrl = getURL("/catalog", locale);
  const logo = headerData?.logoDark || headerData?.logoLight;
  const logoUrl = logo && typeof logo === "object" ? logo.url : null;

  const labels = {
    buyNow: __("Buy now"),
    chooseOptions: __("Choose options"),
    whatsapp: __("Order on WhatsApp"),
    outOfStock: __("Out of Stock"),
    failed: __("Something went wrong. Please try again."),
  };

  const collections = (await getCollections({ page: 1, locale, limit: 30, topLevelOnly: true }, salesChannel)).docs as any[];

  const Row = ({ product }: { product: Product }) => {
    const productUrl = getURL(`/product/${product.slug || product.id}`, locale);
    const pricing = getProductPricing(product, currency);
    const price = pricing?.type === "variant" ? pricing.minPrice || 0 : pricing?.price || 0;
    const salePrice = pricing?.type === "simple" && pricing.salePrice && pricing.salePrice < pricing.price ? pricing.salePrice : null;
    const priceLabel = formatPrice(salePrice || price, currency, exchangeRate);
    const fromPrice = pricing?.type === "variant" && pricing.minPrice !== pricing.maxPrice;

    // Plain "130.00 AED": currency symbols from custom fonts do not show in WhatsApp
    const whatsappPrice = `${((salePrice || price) * exchangeRate).toFixed(2)} ${(currency?.code || "").toUpperCase()}`.trim();
    // The message names the product and links back to it, tagged so the order shows it came from the catalog
    const whatsappText = [settings.whatsappMessage, product.title, whatsappPrice, `${productUrl}?utm_source=${CATALOG_SOURCES.whatsapp}`].filter(Boolean).join("\n");
    const whatsappUrl = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappText)}` : "";

    return (
      <li className="flex items-center gap-4 py-4">
        <a href={productUrl} className="relative block w-20 h-20 overflow-hidden rounded-lg shrink-0 bg-zinc-100 dark:bg-zinc-800 sm:w-24 sm:h-24">
          <ImageOrPlaceholder className="object-cover w-full h-full" image={(product.images?.[0] as any) || null} alt={product.title || ""} loading="lazy" />
        </a>
        <div className="flex-1 min-w-0">
          <a href={productUrl} className="block font-semibold leading-snug">
            {product.title}
          </a>
          {product.excerpt && <p className="mt-1 text-sm text-zinc-500 line-clamp-2 dark:text-zinc-400">{product.excerpt}</p>}
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {fromPrice && <span>{__("From")} </span>}
            {priceLabel}
            {salePrice && <span className="ml-2 text-red-500 line-through">{formatPrice(price, currency, exchangeRate)}</span>}
          </p>
        </div>
        <CatalogActions
          productId={String(product.id)}
          title={product.title || ""}
          productUrl={productUrl}
          checkoutUrl={getURL("/checkout", locale)}
          locale={locale}
          inStock={hasStock(product)}
          needsOptions={product.type === "variant" || (product.type === "bundle" && (product.bundleChoices || []).length > 0)}
          buyOnWebsite={settings.buyOnWebsite}
          whatsappUrl={whatsappUrl}
          labels={labels}
        />
      </li>
    );
  };

  const Cover = () => (
    <header className="relative flex flex-col items-center justify-center px-6 py-12 overflow-hidden text-center text-white bg-zinc-900 sm:rounded-2xl">
      {settings.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={settings.coverImage} alt="" className="absolute inset-0 object-cover w-full h-full opacity-40" />
      )}
      <div className="relative">
        {logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="w-auto h-12 mx-auto mb-4" />
        )}
        <h1 className="text-2xl font-bold">{heading}</h1>
        {settings.intro && <p className="max-w-md mx-auto mt-2 text-sm text-white/85">{settings.intro}</p>}
      </div>
    </header>
  );

  const shell = (children: React.ReactNode) => (
    <div className="max-w-2xl pb-16 mx-auto sm:px-6 sm:pt-6">
      <CatalogSourceTag />
      <Cover />
      <div className="px-4 sm:px-0">{children}</div>
    </div>
  );

  // One collection in full ("See all"), or every product
  if (collectionSlug) {
    const current = collectionSlug === ALL ? null : collections.find((c) => c.slug === collectionSlug);
    if (collectionSlug !== ALL && !current) notFound();
    const result = await getProductsBy({ locale, limit: PER_PAGE, page, sortQuery: ["-createdAt"], whereQuery: current ? { collections: { equals: current.id } } : {} });
    const pageUrl = (n: number) => `${catalogUrl}?collection=${encodeURIComponent(collectionSlug)}${n > 1 ? `&page=${n}` : ""}`;

    return shell(
      <>
        <div className="flex items-center justify-between gap-4 pt-6">
          <h2 className="text-lg font-semibold uppercase">{current ? current.title : __("All products")}</h2>
          <a href={catalogUrl} className="px-4 py-2 text-sm font-semibold rounded-full bg-zinc-100 dark:bg-zinc-800">
            ← {__("Catalog")}
          </a>
        </div>
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {(result.docs as Product[]).map((product) => (
            <Row key={product.id} product={product} />
          ))}
        </ul>
        {result.docs.length === 0 && <p className="py-8 text-center text-zinc-500">{__("No products found")}</p>}
        {(result.hasPrevPage || result.hasNextPage) && (
          <nav className="flex items-center justify-center gap-6 mt-8 text-sm" aria-label={__("Pagination")}>
            {result.hasPrevPage ? <a href={pageUrl(page - 1)}>← {__("Previous")}</a> : <span className="text-zinc-400">← {__("Previous")}</span>}
            <span>
              {page} / {result.totalPages}
            </span>
            {result.hasNextPage ? <a href={pageUrl(page + 1)}>{__("Next")} →</a> : <span className="text-zinc-400">{__("Next")} →</span>}
          </nav>
        )}
      </>,
    );
  }

  // First screen: a few products from each collection
  const sections = (
    await Promise.all(
      collections.map(async (collection) => {
        const result = await getProductsBy({ locale, limit: PREVIEW, sortQuery: ["-createdAt"], whereQuery: { collections: { equals: collection.id } } });
        return { collection, products: result.docs as Product[], total: result.totalDocs };
      }),
    )
  ).filter((section) => section.products.length > 0);

  // A shop without collections gets one plain list
  if (sections.length === 0) {
    const result = await getProductsBy({ locale, limit: PER_PAGE, page: 1, sortQuery: ["-createdAt"] });
    return shell(
      <>
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {(result.docs as Product[]).map((product) => (
            <Row key={product.id} product={product} />
          ))}
        </ul>
        {result.docs.length === 0 && <p className="py-8 text-center text-zinc-500">{__("No products found")}</p>}
        {result.hasNextPage && (
          <p className="mt-6 text-center">
            <a href={`${catalogUrl}?collection=${ALL}&page=2`} className="px-4 py-2 text-sm font-semibold rounded-full bg-zinc-100 dark:bg-zinc-800">
              {__("See all")}
            </a>
          </p>
        )}
      </>,
    );
  }

  return shell(
    <>
      {sections.map(({ collection, products, total }) => (
        <section key={collection.id} className="pt-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold uppercase">{collection.title}</h2>
            {total > products.length && (
              <a href={`${catalogUrl}?collection=${encodeURIComponent(collection.slug)}`} className="px-4 py-2 text-sm font-semibold rounded-full shrink-0 bg-zinc-100 dark:bg-zinc-800">
                {__("See all")}
              </a>
            )}
          </div>
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {products.map((product) => (
              <Row key={product.id} product={product} />
            ))}
          </ul>
        </section>
      ))}
      <p className="mt-8 text-center">
        <a href={`${catalogUrl}?collection=${ALL}`} className="px-4 py-2 text-sm font-semibold rounded-full bg-zinc-100 dark:bg-zinc-800">
          {__("All products")}
        </a>
      </p>
    </>,
  );
}
