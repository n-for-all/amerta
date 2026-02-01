import { getPayload } from "payload";
import configPromise from "@payload-config";

export const getProductsCollections = async (collectionId?: string, isDraftMode?: boolean) => {
  const payload = await getPayload({ config: configPromise });
  const allCollectionsResult = await payload.find({
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
    select: { collections: true },
  });

  // Extract unique collection IDs
  const allCollectionIds = Array.from(
    new Set(
      allCollectionsResult.docs
        .flatMap((product) => {
          if (Array.isArray(product.collections)) {
            return product.collections.map((collection) =>
              typeof collection === "object" ? collection.id : collection
            );
          }
          return [];
        })
        .filter(Boolean),
    ),
  );

  // Fetch collection details
  const collectionsResult = await payload.find({
    collection: "collections",
    draft: isDraftMode,
    pagination: false,
    depth: 0,
    where: {
      id: {
        in: allCollectionIds,
      },
    },
  });

  return collectionsResult.docs;
};
