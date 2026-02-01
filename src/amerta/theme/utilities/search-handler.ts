import { DEFAULT_LOCALE } from "@/amerta/localization/locales";
import { ProductMedia } from "@/payload-types";
import { NextResponse } from "next/server";
import { PayloadRequest } from "payload";
import { getProductPricing } from "./get-product-pricing";
import { getSalesChannel } from "./get-sales-channel";
import { getCurrentCurrency } from "./get-current-currency";
import { getURL } from "@/amerta/utilities/getURL";

export const searchHandler = async (req: PayloadRequest): Promise<Response> => {
  const searchParams = req.searchParams;
  const query = searchParams.get("q");
  const locale = searchParams.get("locale") || DEFAULT_LOCALE;
  const salesChannel = await getSalesChannel();

  if (!query) return NextResponse.json({ results: [] });
  const [products, collections, posts, categories] = await Promise.all([
    req.payload.find({
      collection: "products",
      where: {
        or: [{ title: { like: query } }],
        salesChannels: { equals: salesChannel!.id },
      },
      limit: 10,
      locale: locale as any,
    }),
    req.payload.find({
      collection: "collections",
      where: {
        or: [{ title: { like: query } }],
        salesChannels: { equals: salesChannel!.id },
      },
      limit: 10,
      locale: locale as any,
    }),
    req.payload.find({
      collection: "posts",
      where: {
        title: { like: query },
      },
      limit: 5,
      locale: locale as any,
    }),
    req.payload.find({
      collection: "categories",
      where: {
        title: { like: query },
      },
      limit: 5,
      locale: locale as any,
    }),
  ]);

  const currency = await getCurrentCurrency(salesChannel!);

  return NextResponse.json({
    products: products.docs.map((doc) => {
      const pricing = getProductPricing(doc!, currency);
      return {
        id: doc.id,
        url: getURL(`/products/${doc.slug}`, locale),
        image: doc.images ? (doc.images[0] as ProductMedia).url : null,
        price: pricing ? pricing.minPrice || pricing.price : null,
        title: doc.title,

        available: true,
        discount_in_percentage: 0,
      };
    }),
    articles: posts.docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      url: getURL(`/blog/article/${doc.slug}`, locale),
    })),
    collections: collections.docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      url: getURL(`/collections/${doc.slug}`, locale),
    })),
    categories: categories.docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      url: getURL(`/categories/${doc.slug}`, locale),
    })),
    total_results: products.totalDocs + posts.totalDocs + collections.totalDocs + categories.totalDocs,
  });
};
