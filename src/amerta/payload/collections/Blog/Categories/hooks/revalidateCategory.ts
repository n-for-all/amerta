/**
 * @module Collections/Blog/Categories/Hooks
 * @title Revalidate Category Hook
 * @description This hook revalidates the category page when a category is published or updated, ensuring that users see the most up-to-date information when viewing category pages. The hook is triggered after a change is made to a category document and checks if the document's status is "published" before calling the revalidation function.
 */

import { CollectionAfterChangeHook } from "payload";
import { revalidate } from "@/amerta/utilities/revalidate";

export const revalidateCategory: CollectionAfterChangeHook = ({ doc, req: { payload } }) => {
  if (doc._status === "published") {
    revalidate({ payload, collection: "categories", slug: doc.slug });
  }

  return doc;
};
