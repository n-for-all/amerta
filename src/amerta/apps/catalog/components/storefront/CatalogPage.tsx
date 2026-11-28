import { notFound } from "next/navigation";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { printf } from "fast-printf";
import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import { getURL } from "@/amerta/utilities/getURL";
import { getCatalogSettings } from "@/amerta/apps/catalog/settings";
import { getCatalogContext, getCatalogItems, localImagePath } from "@/amerta/apps/catalog/services/catalogItems";
import { CatalogClient } from "@/amerta/apps/catalog/components/storefront/CatalogClient";
import { getCatalogFrameProps } from "@/amerta/apps/catalog/components/storefront/frameProps";

export async function getCatalogHeading(locale: string): Promise<string | null> {
  const payload = await getPayload({ config: configPromise });
  const { active, settings } = await getCatalogSettings(payload);
  if (!active) return null;
  const siteSettings: any = await getCachedGlobal("settings" as never, 1, locale)();
  return settings.heading || siteSettings?.siteTitle || "Catalog";
}

/**
 * The catalog is a screen of its own, like a menu: a bar with the shop's tools, a cover, then
 * products as rows grouped by collection. Rows open a popup; more rows load while scrolling.
 */
export async function CatalogPage({ locale }: { locale: string }) {
  const ctx = await getCatalogContext(locale);
  if (!ctx) notFound();
  const { settings, __ } = ctx;

  const siteSettings: any = await getCachedGlobal("settings" as never, 1, locale)();
  const headerData: any = await getCachedGlobal("header" as never, 1, locale)();
  const siteTitle = siteSettings?.siteTitle || "";
  const logo = headerData?.logoDark || headerData?.logoLight;
  const first = await getCatalogItems(ctx, 1);

  return (
    <CatalogClient
      locale={locale}
      heading={settings.heading || siteTitle || __("Catalog")}
      intro={settings.intro}
      coverImage={localImagePath(settings.coverImage) || ""}
      logoUrl={logo && typeof logo === "object" ? localImagePath(logo.url) : null}
      websiteUrl={getURL("/", locale) || "/"}
      checkoutUrl={getURL("/catalog/checkout", locale)}
      orderMode={settings.orderMode}
      buyOnWebsite={settings.buyOnWebsite}
      frame={await getCatalogFrameProps(ctx)}
      initialItems={first.items}
      initialHasMore={first.hasMore}
      labels={{
        catalog: __("Catalog"),
        visitWebsite: __("Visit website"),
        buyNow: __("Buy now"),
        addToCart: __("Add to cart"),
        added: __("Added"),
        chooseOptions: __("Choose options"),
        choose: __("Choose"),
        whatsapp: __("Order on WhatsApp"),
        outOfStock: __("Out of Stock"),
        failed: __("Something went wrong. Please try again."),
        from: __("From"),
        loading: __("Loading…"),
        noProducts: __("No products found"),
        endQuestion: __("Can't find what you are looking for?"),
        endLink: printf(__("Visit %s"), siteTitle || __("our website")),
        close: __("Close"),
      }}
    />
  );
}
