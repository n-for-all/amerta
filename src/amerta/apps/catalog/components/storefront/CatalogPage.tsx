import { notFound } from "next/navigation";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { Product } from "@/payload-types";
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

export async function getCatalogHeading(locale: string): Promise<string | null> {
  const payload = await getPayload({ config: configPromise });
  const { active, settings } = await getCatalogSettings(payload);
  if (!active) return null;
  const siteSettings: any = await getCachedGlobal("settings" as never, 1, locale)();
  return settings.heading || siteSettings?.siteTitle || "Catalog";
}

export async function CatalogPage({ locale, page = 1 }: { locale: string; page?: number }) {
  const payload = await getPayload({ config: configPromise });
  const { active, settings } = await getCatalogSettings(payload);
  if (!active) notFound();

  const __ = await createTranslator(locale);
  const siteSettings: any = await getCachedGlobal("settings" as never, 1, locale)();
  const salesChannel = await getSalesChannel();
  const currency = await getCurrentCurrency(salesChannel);
  const exchangeRate = Number(getExchangeRate(getDefaultCurrency(salesChannel), currency, salesChannel) || 1);

  const result = await getProductsBy({ locale, limit: PER_PAGE, page, sortQuery: ["-createdAt"] });
  const products = result.docs as Product[];

  const whatsappNumber = settings.orderOnWhatsapp ? whatsappDigits(settings.whatsappNumber) : "";
  const heading = settings.heading || siteSettings?.siteTitle || __("Catalog");
  const pageUrl = (n: number) => `${getURL("/catalog", locale)}${n > 1 ? `?page=${n}` : ""}`;

  const labels = {
    buyNow: __("Buy now"),
    chooseOptions: __("Choose options"),
    whatsapp: __("Order on WhatsApp"),
    outOfStock: __("Out of Stock"),
    failed: __("Something went wrong. Please try again."),
  };

  return (
    <div className="px-4 pt-10 pb-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <CatalogSourceTag />
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-medium uppercase">{heading}</h1>
        {settings.intro && <p className="max-w-xl mx-auto mt-3 text-zinc-600 dark:text-zinc-400">{settings.intro}</p>}
      </header>

      {products.length === 0 ? (
        <p className="text-center text-zinc-600 dark:text-zinc-400">{__("No products found")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
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
              <li key={product.id} className="flex flex-col">
                <a href={productUrl} className="relative block w-full overflow-hidden rounded-lg aspect-3/4">
                  <ImageOrPlaceholder className="object-contain w-full h-full" image={(product.images?.[0] as any) || null} alt={product.title || ""} loading="lazy" />
                </a>
                <div className="flex flex-col flex-1 gap-2 pt-3">
                  <a href={productUrl} className="uppercase text-sm/6">
                    {product.title}
                  </a>
                  <p className="font-semibold">
                    {fromPrice && <span className="font-normal text-zinc-500 dark:text-zinc-400">{__("From")} </span>}
                    {priceLabel}
                    {salePrice && <span className="ml-2 text-sm font-normal text-red-500 line-through">{formatPrice(price, currency, exchangeRate)}</span>}
                  </p>
                  <div className="mt-auto">
                    <CatalogActions productId={String(product.id)} title={product.title || ""} productUrl={productUrl} checkoutUrl={getURL("/checkout", locale)} locale={locale} inStock={hasStock(product)} needsOptions={product.type === "variant" || (product.type === "bundle" && (product.bundleChoices || []).length > 0)} buyOnWebsite={settings.buyOnWebsite} whatsappUrl={whatsappUrl} labels={labels} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {(result.hasPrevPage || result.hasNextPage) && (
        <nav className="flex items-center justify-center gap-6 mt-12 text-sm uppercase" aria-label={__("Pagination")}>
          {result.hasPrevPage ? <a href={pageUrl(page - 1)}>← {__("Previous")}</a> : <span className="text-zinc-400">← {__("Previous")}</span>}
          <span>
            {page} / {result.totalPages}
          </span>
          {result.hasNextPage ? <a href={pageUrl(page + 1)}>{__("Next")} →</a> : <span className="text-zinc-400">{__("Next")} →</span>}
        </nav>
      )}
    </div>
  );
}
