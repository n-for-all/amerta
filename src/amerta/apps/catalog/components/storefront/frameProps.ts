import { getCurrencies } from "@/amerta/core/utilities/get-currencies";
import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import { getURL } from "@/amerta/utilities/getURL";
import { LOCALES } from "@/amerta/localization/locales";
import type { getCatalogContext } from "@/amerta/apps/catalog/services/catalogItems";
import type { CatalogFrameProps } from "@/amerta/apps/catalog/components/storefront/CatalogFrame";

type Context = NonNullable<Awaited<ReturnType<typeof getCatalogContext>>>;

/** What the catalog's top bar needs: currencies, languages, the theme switch and its labels. */
export async function getCatalogFrameProps(ctx: Context): Promise<CatalogFrameProps> {
  const { locale, salesChannel, currency, __ } = ctx;
  const siteSettings: any = await getCachedGlobal("settings" as never, 1, locale)();
  const headerData: any = await getCachedGlobal("header" as never, 1, locale)();
  const enabledLocales = siteSettings?.locales as string[] | undefined;

  return {
    locale,
    accountUrl: getURL("/account", locale),
    enableThemeSwitch: !!headerData?.enableThemeSwitch,
    currencies: await getCurrencies(salesChannel),
    currentCurrency: currency,
    locales: LOCALES.filter((l) => (enabledLocales ? enabledLocales.includes(l.code) : true)).map((l) => ({ label: l.label, code: l.code })),
    labels: { search: __("Search"), account: __("Account"), toggleTheme: __("Toggle theme"), backToCatalog: __("Back to catalog") },
  };
}
