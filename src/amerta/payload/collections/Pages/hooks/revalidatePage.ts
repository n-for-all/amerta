/**
 * @module Collections/Pages/Hooks
 * @title Revalidate Page Hook
 * @description This hook revalidates the cache for a page when it is created, updated, or deleted. It ensures that the homepage and other pages are properly revalidated.
 */

import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

import { revalidatePath, revalidateTag } from "next/cache";

import type { Page } from "@/payload-types";

export const revalidatePage: CollectionAfterChangeHook<Page> = ({ doc, previousDoc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    if (doc._status === "published") {
      const path = doc.isFrontPage ? "/" : `/${doc.slug}`;

      payload.logger.info(`Revalidating page at path: ${path}`);

      revalidatePath(path);
      revalidateTag("pages-sitemap", "max");
    }

    // If the page was previously published, we need to revalidate the old path
    if (previousDoc?._status === "published" && doc._status !== "published") {
      const oldPath = previousDoc.isFrontPage ? "/" : `/${previousDoc.slug}`;

      payload.logger.info(`Revalidating old page at path: ${oldPath}`);

      revalidatePath(oldPath);
      revalidateTag("pages-sitemap", "max");
    }
  }
  return doc;
};

export const revalidateDelete: CollectionAfterDeleteHook<Page> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = doc?.isFrontPage ? "/" : `/${doc?.slug}`;
    revalidatePath(path);
    revalidateTag("pages-sitemap", "max");
  }

  return doc;
};
