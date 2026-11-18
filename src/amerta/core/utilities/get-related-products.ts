import { LocaleCode } from "@/amerta/localization/locales";
import { getPayload } from "payload";
import config from "@payload-config";
import { Product, SalesChannel } from "@/payload-types";

export const getRelatedProducts = async (product: Product, salesChannel: SalesChannel, locale?: string): Promise<Product[]> => {
  if (!product.relatedProducts || product.relatedProducts.length === 0) {
    return [];
  }

  const relatedProductIds = product.relatedProducts.map((rel) => (typeof rel === "string" ? rel : rel.id)).filter(Boolean);

  if (relatedProductIds.length === 0) {
    return [];
  }

  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "products",
    where: {
      id: {
        in: relatedProductIds,
      },
      "salesChannels.id": {
        equals: salesChannel.id,
      },
      notSoldSeparately: { not_equals: true },
      _status: { equals: "published" },
    },
    limit: relatedProductIds.length,
    locale: locale as LocaleCode,
  });

  return docs;
};

/** Published bundles a product is part of (as an included product or a customer choice), e.g. for "not sold separately" pages. */
export const getBundlesIncluding = async (productId: string, locale?: string): Promise<Product[]> => {
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "products",
    where: {
      type: { equals: "bundle" },
      _status: { equals: "published" },
      or: [{ "bundleChoices.products": { in: [productId] } }, { "bundleItems.product": { equals: productId } }],
    },
    depth: 1,
    limit: 10,
    locale: locale as LocaleCode,
  });
  return docs;
};
