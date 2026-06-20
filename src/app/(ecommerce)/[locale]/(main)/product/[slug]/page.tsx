import { Metadata } from "next";
import { notFound } from "next/navigation";
import configPromise from "@payload-config";
import { type Product } from "@/payload-types";
import { generateMeta } from "@/amerta/utilities/generateMeta";
import { getPayload } from "payload";

import ProductDetail from "@/amerta/theme/components/ProductDetail";
import { getSalesChannel } from "@/amerta/theme/utilities/get-sales-channel";
import { getProductPricing } from "@/amerta/theme/utilities/get-product-pricing";
import { getAllProductOptions } from "@/amerta/theme/utilities/get-product-options";
import { getProductBySlug } from "@/amerta/theme/utilities/get-product-by-slug";
import { getDefaultCurrency } from "@/amerta/theme/utilities/get-default-currency";

export const dynamic = "force-dynamic";

import { generateProductJSONLD } from "@/amerta/utilities/generateProductJSONLD";

export default async function ProductPage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
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
  const url = `${process.env.NEXT_PUBLIC_SERVER_URL}/${locale}/product/${slug}`;
  
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
      <ProductDetail product={product} locale={locale} options={options} />
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
