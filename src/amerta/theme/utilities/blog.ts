import { getPayload } from "payload";
import configPromise from "@payload-config";
import { Post } from "@/payload-types";
import { LocaleCode } from "@/amerta/localization/locales";

/**
 * Retrieves a single blog post by its slug handle.
 * @param handle - The slug of the blog post.
 * @param locale - Optional locale code for localization.
 * @returns The blog post or null if not found.
 * @example
 * const post = await getBlogPostByHandle("my-post", "en");
 */
export async function getBlogPostByHandle(handle: string, locale?: string) {
  const payload = await getPayload({ config: configPromise });
  const posts = await payload.find({
    collection: "posts",
    where: { slug: { equals: handle }, _status: { equals: "published" } },
    limit: 1,
    locale: locale as LocaleCode,
    fallbackLocale: false,
  });
  return posts.docs[0] || null;
}

/**
 * Retrieves a paginated list of published blog posts.
 * @param limit - Maximum number of posts to return per page.
 * @param page - Page number as string.
 * @param locale - Optional locale code for localization.
 * @param filter - Additional filter criteria.
 * @param sort - Sort order string.
 * @returns Paginated posts result.
 * @example
 * const posts = await getBlogPosts({ limit: 10, page: "1", locale: "en" });
 */
export async function getBlogPosts({ limit = 12, page = "1", locale, filter = {}, sort }: { limit?: number; page?: string; locale?: string; filter?: Record<string, any>; sort?: string }) {
  const payload = await getPayload({ config: configPromise });
  const posts = await payload.find({
    collection: "posts",
    where: { _status: { equals: "published" }, ...filter },
    limit,
    page: parseInt(page, 10),
    locale: locale as LocaleCode,
    sort: sort || "-publishedAt",
  });
  return posts;
}

/**
 * Retrieves blog posts filtered by a specific category.
 * @param limit - Maximum number of posts to return per page.
 * @param page - Page number as string.
 * @param category - Category ID to filter by.
 * @param locale - Optional locale code for localization.
 * @param filter - Additional filter criteria.
 * @param sort - Sort order string.
 * @returns Paginated posts result filtered by category.
 * @example
 * const posts = await getBlogPostsByCategory({ limit: 10, page: "1", category: "cat123", locale: "en" });
 */
export async function getBlogPostsByCategory({ limit = 12, page = "1", category, locale, filter = {}, sort }: { limit?: number; page?: string; category: string; locale?: string; filter?: Record<string, any>; sort?: string }) {
  const payload = await getPayload({ config: configPromise });
  const posts = await payload.find({
    collection: "posts",
    where: { _status: { equals: "published" }, categories: { equals: category }, ...filter },
    limit,
    page: parseInt(page, 10),
    locale: locale as LocaleCode,
    sort: sort || "-publishedAt",
  });
  return posts;
}

/**
 * Retrieves a category by its slug.
 * @param slug - The slug of the category.
 * @param locale - Optional locale code for localization.
 * @returns The category or null if not found.
 * @example
 * const category = await getCategoryBySlug("tech", "en");
 */
export async function getCategoryBySlug(slug: string, locale?: string) {
  const payload = await getPayload({ config: configPromise });
  const categories = await payload.find({
    collection: "categories",
    where: { slug: { equals: slug }, _status: { equals: "published" } },
    limit: 1,
    locale: locale as LocaleCode,
  });
  return categories.docs[0] || null;
}

/**
 * Retrieves all published categories.
 * @param locale - Optional locale code for localization.
 * @returns Array of all categories.
 * @example
 * const categories = await getAllCategories("en");
 */
export async function getAllCategories(locale?: string) {
  const payload = await getPayload({ config: configPromise });
  const categories = await payload.find({
    collection: "categories",
    where: { _status: { equals: "published" } },
    limit: 100,
    locale: locale as LocaleCode,
  });
  return categories.docs;
}

/**
 * Retrieves related posts for a given post based on shared categories, with shuffled results.
 * @param postId - The ID of the current post.
 * @param limit - Maximum number of related posts to return.
 * @param locale - Optional locale code for localization.
 * @returns Array of related posts.
 * @example
 * const related = await getRelatedPosts("post123", 4, "en");
 */
export async function getRelatedPosts(postId: string, limit = 4, locale?: string) {
  const payload = await getPayload({ config: configPromise });

  // 1. Fetch the current post to retrieve its categories
  // depth: 0 ensures we get IDs strings, not full objects
  const currentPost = await payload.findByID({
    collection: "posts",
    id: postId,
    depth: 0,
    locale: locale as LocaleCode,
  });

  const categoryIds = currentPost?.categories ? (currentPost.categories as any[]).map((cat) => (typeof cat === "object" ? cat.id : cat)) : [];

  let candidates: Post[] = [];

  // 2. Strategy A: Find posts with matching categories
  if (categoryIds.length > 0) {
    const { docs } = await payload.find({
      collection: "posts",
      where: {
        _status: { equals: "published" },
        id: { not_equals: postId }, // Exclude current
        categories: { in: categoryIds }, // The "in" operator matches ANY of the IDs
      },
      // Fetch a larger pool (e.g., 4x the limit) to allow for good shuffling
      limit: limit * 4,
      depth: 1,
      locale: locale as LocaleCode,
    });
    candidates = docs as Post[];
  }

  // 3. Strategy B: Backfill with recent posts if we didn't find enough
  if (candidates.length < limit) {
    const { docs: fallbackDocs } = await payload.find({
      collection: "posts",
      where: {
        _status: { equals: "published" },
        id: { not_equals: postId },
        // Exclude ones we already found to avoid duplicates
        ...(candidates.length > 0 && {
          id: { not_in: candidates.map((p) => p.id) },
        }),
      },
      limit: limit - candidates.length,
      sort: "-publishedAt", // Just give the newest ones
      depth: 1,
      locale: locale as LocaleCode,
    });

    candidates = [...candidates, ...(fallbackDocs as Post[])];
  }

  // 4. Shuffle the candidates in JavaScript (Fisher-Yates Shuffle)
  // This gives that "fresh" feeling on reload
  const shuffled = candidates.sort(() => 0.5 - Math.random());

  // 5. Return only the requested amount
  return shuffled.slice(0, limit);
}

/**
 * Retrieves a tag by its slug.
 * @param slug - The slug of the tag.
 * @param locale - Optional locale code for localization.
 * @returns The tag or null if not found.
 * @example
 * const tag = await getTagBySlug("javascript", "en");
 */
export async function getTagBySlug(slug: string, locale?: string) {
  const payload = await getPayload({ config: configPromise });
  const tags = await payload.find({
    collection: "tags",
    where: { slug: { equals: slug }, _status: { equals: "published" } },
    limit: 1,
    locale: locale as LocaleCode,
  });
  return tags.docs[0] || null;
}

/**
 * Retrieves all published tags.
 * @param locale - Optional locale code for localization.
 * @returns Array of all tags.
 * @example
 * const tags = await getAllTags("en");
 */
export async function getAllTags(locale?: string) {
  const payload = await getPayload({ config: configPromise });
  const tags = await payload.find({
    collection: "tags",
    where: { _status: { equals: "published" } },
    limit: 100,
    locale: locale as LocaleCode,
  });
  return tags.docs;
}

/**
 * Retrieves blog posts filtered by a specific tag.
 * @param limit - Maximum number of posts to return per page.
 * @param page - Page number as string.
 * @param tag - Tag ID to filter by.
 * @param locale - Optional locale code for localization.
 * @returns Paginated posts result filtered by tag.
 * @example
 * const posts = await getBlogPostsByTag({ limit: 10, page: "1", tag: "tag123", locale: "en" });
 */
export async function getBlogPostsByTag({ limit = 12, page = "1", tag, locale }: { limit?: number; page?: string; tag: string; locale?: string }) {
  const payload = await getPayload({ config: configPromise });
  const posts = await payload.find({
    collection: "posts",
    where: { _status: { equals: "published" }, tags: { equals: tag } },
    limit,
    page: parseInt(page, 10),
    locale: locale as LocaleCode,
  });
  return posts;
}
