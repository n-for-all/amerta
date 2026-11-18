import { getPayload, Where } from "payload";
import configPromise from "@payload-config";
import type { ProductReview, ThemeShopReviewsBlock } from "@/payload-types";

/**
 * Approved reviews for the Reviews block (all of them, or those of the selected products), most recent first,
 * with their average rating. Shared by Amerta's block and any theme that restyles it.
 */
export const getBlockReviews = async (block: Pick<ThemeShopReviewsBlock, "source" | "products" | "limit">): Promise<{ reviews: ProductReview[]; average: number }> => {
  const productIds = (block.products || []).map((p) => (typeof p === "object" ? p.id : p)).filter(Boolean);
  if (block.source === "products" && productIds.length === 0) return { reviews: [], average: 0 };

  const where: Where = { status: { equals: "approved" } };
  if (block.source === "products") where.product = { in: productIds };

  const payload = await getPayload({ config: configPromise });
  const { docs } = await payload.find({
    collection: "product-reviews",
    where,
    sort: "-createdAt",
    limit: Math.min(Math.max(Number(block.limit) || 6, 1), 50),
    depth: 0,
  });
  const reviews = docs.filter((r) => r.content);
  const average = reviews.length ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length : 0;
  return { reviews, average };
};
