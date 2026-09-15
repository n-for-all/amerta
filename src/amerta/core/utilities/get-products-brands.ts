import { getPayload } from "payload";
import configPromise from "@payload-config";

export const getProductsBrands = async (collectionId?: string, isDraftMode?: boolean) => {
  const payload = await getPayload({ config: configPromise });
  const allBrandsResult = await payload.find({
    collection: "products",
    draft: isDraftMode,
    pagination: false, // Disable pagination to get ALL items
    depth: 0, // Don't populate relationships (keeps it fast)
    ...(collectionId && {
      where: {
        collections: {
          equals: collectionId,
        },
      },
    }),
    select: { brand: true },
  });

  // Extract unique brand IDs
  const allBrandIds = Array.from(
    new Set(
      allBrandsResult.docs
        .map((product) => {
          return typeof product.brand === "object" ? product.brand?.id : product.brand;
        })
        .filter(Boolean),
    ),
  );

  // Fetch brand details
  const brandsResult = await payload.find({
    collection: "product-brands",
    draft: isDraftMode,
    pagination: false,
    depth: 0,
    where: {
      id: {
        in: allBrandIds,
      },
    },
  });

  return brandsResult.docs;
};
