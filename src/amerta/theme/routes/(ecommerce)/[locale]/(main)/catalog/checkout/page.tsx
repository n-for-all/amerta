import Checkout from "@/amerta/theme/components/Checkout";
import { getCheckoutData } from "@/amerta/core/utilities/get-checkout-data";
import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import type { EcommerceSettings } from "@/payload-types";
import { Config } from "payload";
import { Logo } from "@/amerta/theme/blocks/common/Header/logo";
import { generateStaticMeta } from "@/amerta/utilities/generateMeta";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import { getCurrentCart } from "@/amerta/core/utilities/get-current-cart";
import { getURL } from "@/amerta/utilities/getURL";
import { createTranslator } from "@/amerta/core/utilities/translation";
import { CatalogCheckoutFrame } from "@/amerta/apps/catalog/components/storefront/CatalogCheckoutFrame";

// Catalog app: the catalog's own checkout page. It shows the shop's checkout form inside the
// catalog's layout, and only exists while the Catalog app is active. The regular /checkout page
// is separate and unchanged.
export default async function CatalogCheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cart = await getCurrentCart(locale);

  // An empty cart leads back to the catalog, not to the shop
  if (!cart?.items?.length) {
    const __ = await createTranslator(locale);
    return (
      <CatalogCheckoutFrame locale={locale}>
        <div className="px-4 py-12 mx-auto text-center max-w-7xl">
          <h1 className="text-xl font-semibold">{__("Your cart is empty")}</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{__("Add items to your cart before checking out.")}</p>
          <a href={getURL("/catalog", locale)} className="inline-block px-5 py-2 mt-5 text-sm font-medium text-white rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900">
            {__("Back to catalog")}
          </a>
        </div>
      </CatalogCheckoutFrame>
    );
  }

  const data = await getCheckoutData(locale);
  const ecommerceSettings: EcommerceSettings = await getCachedGlobal("ecommerce-settings" as keyof Config["globals"], 1, locale)();
  return (
    <CatalogCheckoutFrame locale={locale}>
      {/* The checkout form itself is the shop's; here it is only tightened to match the catalog's compact look */}
      <div className="px-4 pt-5 pb-12 mx-auto max-w-7xl sm:px-6 lg:px-8 [&_h1]:mb-4 [&_h1]:text-2xl [&_.text-2xl]:text-lg [&_.mt-10]:mt-6 [&_.pt-10]:pt-6 [&_.space-y-10>*+*]:mt-6 [&_.mb-8]:mb-4 [&_.mb-6]:mb-3 [&_.mt-8]:mt-5 [&_.mt-6]:mt-4">
        <Checkout data={data} cart={cart} ecommerceSettings={ecommerceSettings} logo={<Logo logoClassName="flex justify-center h-10 md:h-10" locale={locale} />} />
      </div>
    </CatalogCheckoutFrame>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticMeta({ pageName: "checkoutPage", locale, type: "checkout" });
}
