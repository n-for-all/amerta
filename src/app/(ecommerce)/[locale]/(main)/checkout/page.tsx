import Checkout from "@/amerta/theme/components/Checkout";
import { getCheckoutData } from "@/amerta/theme/utilities/get-checkout-data";
import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import type { EcommerceSettings } from "@/payload-types";
import { Config } from "payload";
import { Logo } from "@/amerta/theme/blocks/common/Header/logo";
import { generateStaticMeta } from "@/amerta/utilities/generateMeta";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import { getCurrentCart } from "@/amerta/theme/utilities/get-current-cart";

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const data = await getCheckoutData(locale);
  const ecommerceSettings: EcommerceSettings = await getCachedGlobal("ecommerce-settings" as keyof Config["globals"], 1, locale)();
  return (
    <div className="px-4 pt-16 pb-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <Checkout data={data} cart={await getCurrentCart()} ecommerceSettings={ecommerceSettings} logo={<Logo logoClassName="flex justify-center h-10 md:h-10" locale={locale} />} />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const metaData = await generateStaticMeta({ pageName: "checkoutPage", locale, type: "checkout" });
  return metaData;
}
