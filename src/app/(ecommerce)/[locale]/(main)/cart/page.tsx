import CartPage from "@/amerta/theme/components/CartPage";
import { createTranslator } from "@/amerta/theme/utilities/translation";
import { generateStaticMeta } from "@/amerta/utilities/generateMeta";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";

export default async function CartMainPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const __ = await createTranslator(locale);
  return (
    <div className="pt-16 pb-16 mx-auto max-w-7xl">
      <h1 className="text-[2rem] sm:text-4xl xl:text-[2.5rem] leading-none font-medium">{__("Shopping Cart")}</h1>
      <CartPage />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const metaData = await generateStaticMeta({ pageName: "cartPage", locale, type: "cart" });
  return metaData;
}
