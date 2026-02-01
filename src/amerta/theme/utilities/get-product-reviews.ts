import { getPayload } from "payload";
import configPromise from "@payload-config";

export const getProductReviews = async (productId: string, page: number = 1, limit: number = 100) => {
  const payload = await getPayload({ config: configPromise });
  const reviews = await payload.find({
    collection: "product-reviews",
    where: {
      product: {
        equals: productId,
      },
      status: {
        equals: "approved",
      },
    },
    page,
    limit,
  });
  return reviews.docs;
};