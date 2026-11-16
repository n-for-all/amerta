import { Metadata } from "next";
import { notFound } from "next/navigation";
import { type Product } from "@/payload-types";
import { generateMeta } from "@/amerta/utilities/generateMeta";

import ProductDetail from "@/amerta/theme/components/ProductDetail";
import { getSalesChannel } from "@/amerta/core/utilities/get-sales-channel";
import { getProductPricing } from "@/amerta/core/utilities/get-product-pricing";
import { getAllProductOptions } from "@/amerta/core/utilities/get-product-options";
import { getProductBySlug } from "@/amerta/core/utilities/get-product-by-slug";
import { getDefaultCurrency } from "@/amerta/core/utilities/get-default-currency";



import { generateProductJSONLD } from "@/amerta/utilities/generateProductJSONLD";
import { getURL } from "@/amerta/utilities/getURL";

export default async function ProductPage({ params, searchParams }: { params: Promise<{ slug: string; locale: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug, locale } = await params;
  // Bundles: ?choice=<product id>[,<product id>] preselects the customer's choices
  const choiceParam = (await searchParams)?.choice;
  const choices = (Array.isArray(choiceParam) ? choiceParam.join(",") : choiceParam || "").split(",").filter(Boolean);
  let product: Product | null = null;

  try {
    product = await getProductBySlug({ slug, locale });
  } catch (error) {
    console.error(error);
  }

  if (!product) {
    return notFound();
  }

  const options = await getAllProductOptions(locale);

  const salesChannel = await getSalesChannel();
  const currency = getDefaultCurrency(salesChannel!);
  const url = getURL(`/${locale}/product/${slug}`);
  
  let jsonLd = null;
  try {
    jsonLd = generateProductJSONLD(product, currency, url);
  } catch (err) {
    console.error("Failed to generate product JSON-LD:", err);
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetail product={product} locale={locale} options={options} choices={choices} />
    </>
  );
}

type Args = {
  params: Promise<{
    slug?: string;
    locale: string;
  }>;
};

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug, locale } = await paramsPromise;
  if (!slug) {
    return {};
  }

  const salesChannel = await getSalesChannel();
  const currency = getDefaultCurrency(salesChannel!);
  const product = await getProductBySlug({
    locale,
    slug,
  });

  if(!product) {
    return {};
  }

  const price = await getProductPricing(product!, currency);

  return generateMeta({ doc: product, type: "products", locale, ogType: "product", price: { amount: price?.minPrice, currencyCode: currency?.code } });
}
