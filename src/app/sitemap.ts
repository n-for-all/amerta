import { MetadataRoute } from "next";
import { CollectionSlug, Config, getPayload } from "payload";
import configPromise from "@payload-config";
import { getLinkUrl, getServerSideURL } from "@/amerta/utilities/getURL";
import { DocType } from "@/amerta/utilities/getPathSegment";
import { DEFAULT_LOCALE, LocaleCode } from "@/amerta/localization/locales";
import { getGlobal } from "@/amerta/utilities/getGlobals";
import { Settings } from "@/payload-types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config: configPromise });
  const baseUrl = getServerSideURL();

  const lastModified = new Date();

  // 1. Define Static Pages (Exclude Auth/Account pages)
  // We manually list the public "index" pages from your switch statement
  const staticRoutes = [
    "", // Home
    "/blog",
    "/collections",
    "/products",
    "/brands",
    "/tags",
  ];

  const staticMap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // 2. Fetch Dynamic Content
  // Helper to fetch and map docs
  const generateEntries = async (collection: CollectionSlug, type: DocType, locale: LocaleCode) => {
    try {
      const whereQuery = {};
      switch (collection) {
        case "pages":
          Object.assign(whereQuery, {
            isFrontPage: {
              equals: false,
            },
            _status: {
              equals: "published",
            },
          });
          break;
        case "products":
        case "product-brands":
        case "collections":
        case "product-tags":
        case "posts":
        case "categories":
        case "tags":
          Object.assign(whereQuery, {
            _status: {
              equals: "published",
            },
          });
          break;
      }

      const { docs } = await payload.find({
        collection: collection,
        limit: 20000, // Adjust based on your scale (might need pagination loop for huge sites)
        depth: 0,
        where: whereQuery,
        locale,
        select: { slug: true, updatedAt: true },
        fallbackLocale: false
      });

      return docs.map((doc: any) => ({
        url: getLinkUrl({ type: "reference", reference: { relationTo: collection, value: doc }, locale }),
        lastModified: new Date(doc.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
    } catch (error) {
      console.error(`Failed to generate sitemap for ${collection}`, error);
      return [];
    }
  };

  const allEntries: any = [];

  const settings: Settings = await getGlobal("settings" as keyof Config["globals"], 1);
  const locales: LocaleCode[] = settings.locales && (settings.locales as LocaleCode[]).length > 0 ? (settings.locales as LocaleCode[]) : [DEFAULT_LOCALE];

  for (const locale of locales) {
    // 3. Execute Fetches in Parallel
    const [pages, posts, categories, tags, products, productsTags, collections, brands] = await Promise.all([
      generateEntries("pages", "page", locale),
      generateEntries("posts", "post", locale),
      generateEntries("categories", "category", locale),
      generateEntries("tags", "tags", locale),
      generateEntries("products", "products", locale),
      generateEntries("product-tags", "product-tags", locale),
      generateEntries("collections", "collection", locale),
      generateEntries("product-brands", "brands", locale),
    ]);

    // 4. Combine Everything
    allEntries.push(...pages, ...posts, ...categories, ...tags, ...products, ...productsTags, ...collections, ...brands);
  }
  return [...staticMap, ...allEntries];
}
