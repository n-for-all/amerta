import { ThemeShopCollectionShowcaseBlockClient } from "./Component.client";
import configPromise from "@payload-config";
import { getPayload } from "payload";

interface CollectionWithChildren {
  id: string;
  title: string;
  slug: string;
  image?: any;
  children?: CollectionWithChildren[];
}

export const ThemeShopCollectionShowcaseBlock: React.FC<any> = async ({ params, title, subtitle, collections, className }: any) => {
  try {
    const payload = await getPayload({ config: configPromise });

    // Fetch full collection data with children
    const enrichedCollections: CollectionWithChildren[] = [];

    if (collections && Array.isArray(collections)) {
      for (const collection of collections) {
        const collectionId = typeof collection === "string" ? collection : collection.id;

        try {
          const collectionDoc = await payload.findByID({
            collection: "collections",
            id: collectionId,
            depth: 2, // Fetch children
          });

          if (collectionDoc && collectionDoc._status === "published") {
            // Fetch child collections
            const childCollections = await payload.find({
              collection: "collections",
              where: {
                parent: {
                  equals: collectionId,
                },
              },
              depth: 1,
            });

            enrichedCollections.push({
              id: collectionDoc.id,
              title: collectionDoc.title,
              slug: collectionDoc.slug!,
              image: collectionDoc.image,
              children: childCollections.docs.map((child: any) => ({
                id: child.id,
                title: child.title,
                name: child.name || child.title,
                slug: child.slug,
                image: child.image,
              })),
            });
          }
        } catch (error) {
          console.error(`Error fetching collection ${collectionId}:`, error);
        }
      }
    }

    return <ThemeShopCollectionShowcaseBlockClient title={title} subtitle={subtitle} collections={enrichedCollections} className={className} locale={params?.locale} />;
  } catch (error) {
    console.error("Error in ThemeShopCollectionShowcaseBlock:", error);
    return <ThemeShopCollectionShowcaseBlockClient title={title} subtitle={subtitle} collections={collections} className={className} locale={params?.locale} />;
  }
};
