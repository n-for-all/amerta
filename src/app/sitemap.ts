import { MetadataRoute } from "next";
import { CollectionSlug, Config, getPayload } from "payload";

export const dynamic = "force-dynamic";
import configPromise from "@payload-config";
import { getLinkUrl, getServerSideURL } from "@/amerta/utilities/getURL";
import { DocType } from "@/amerta/utilities/getPathSegment";
import { DEFAULT_LOCALE, LocaleCode } from "@/amerta/localization/locales";
import { getGlobal } from "@/amerta/utilities/getGlobals";
import { Settings } from "@/payload-types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config: configPromise });
  const baseUrl = getServerSideURL();

  // 1. Public index pages, listed for every language (e.g. /products and /ar/products).
  // Brand, tag and category listings are left out: they are thin, and tag/category pages
  // name /blog as their canonical, so they don't belong in a sitemap.
  const staticRoutes = [
    "", // Home
    "/products",
    "/collections",
    "/blog",
  ];

  // 2. Fetch Dynamic Content
  // Helper to fetch and map docs
  const generateEntries = async (collection: CollectionSlug, type: DocType, locale: LocaleCode) => {
    try {
      const whereQuery = {};
      switch (collection) {
        case "pages":
          Object.assign(whereQuery, {
            // not_equals: pages created before the field existed have no isFrontPage value at all
            isFrontPage: {
              not_equals: true,
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

  const staticMap: MetadataRoute.Sitemap = [];
  for (const locale of locales) {
    const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
    for (const route of staticRoutes) {
      staticMap.push({
        url: `${baseUrl}${prefix}${route}`,
        changeFrequency: "daily" as const,
        priority: route === "" ? 1.0 : 0.8,
      });
    }

    // 3. Execute Fetches in Parallel
    const [pages, posts, products, collections] = await Promise.all([
      generateEntries("pages", "page", locale),
      generateEntries("posts", "post", locale),
      generateEntries("products", "products", locale),
      generateEntries("collections", "collection", locale),
    ]);

    // 4. Combine Everything
    allEntries.push(...pages, ...posts, ...products, ...collections);
  }
  return [...staticMap, ...allEntries];
}
