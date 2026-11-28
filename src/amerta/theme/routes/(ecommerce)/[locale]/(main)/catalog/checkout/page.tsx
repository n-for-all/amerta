import Checkout from "@/amerta/theme/components/Checkout";
import { getCheckoutData } from "@/amerta/core/utilities/get-checkout-data";
import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import type { EcommerceSettings } from "@/payload-types";
import { Config } from "payload";
import { Logo } from "@/amerta/theme/blocks/common/Header/logo";
import { generateStaticMeta } from "@/amerta/utilities/generateMeta";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import { getCurrentCart } from "@/amerta/core/utilities/get-current-cart";
import { CatalogCheckoutFrame } from "@/amerta/apps/catalog/components/storefront/CatalogCheckoutFrame";

// Catalog app: the catalog's own checkout page. It shows the shop's checkout form inside the
// catalog's layout, and only exists while the Catalog app is active. The regular /checkout page
// is separate and unchanged.
export default async function CatalogCheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = await getCheckoutData(locale);
  const ecommerceSettings: EcommerceSettings = await getCachedGlobal("ecommerce-settings" as keyof Config["globals"], 1, locale)();
  return (
    <CatalogCheckoutFrame locale={locale}>
      <div className="px-4 pt-10 pb-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <Checkout data={data} cart={await getCurrentCart(locale)} ecommerceSettings={ecommerceSettings} logo={<Logo logoClassName="flex justify-center h-10 md:h-10" locale={locale} />} />
      </div>
    </CatalogCheckoutFrame>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticMeta({ pageName: "checkoutPage", locale, type: "checkout" });
}
