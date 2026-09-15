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
    },
    limit: relatedProductIds.length,
    locale: locale as LocaleCode,
  });

  return docs;
};
