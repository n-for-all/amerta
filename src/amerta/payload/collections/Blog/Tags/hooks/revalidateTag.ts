/**
 * @module Collections/Blog/Tags/Hooks
 * @title Revalidate Tag Hook
 * @description This hook revalidates the tag page when a tag is published or updated, ensuring that users see the most up-to-date information when viewing tag pages. The hook is triggered after a change is made to a tag document and checks if the document's status is "published" before calling the revalidation function.
 */

import { CollectionAfterChangeHook } from "payload";
import { revalidate } from "@/amerta/utilities/revalidate";

export const revalidateTag: CollectionAfterChangeHook = ({ doc, req: { payload } }) => {
  if (doc._status === "published") {
    revalidate({ payload, collection: "tags", slug: doc.slug });
  }

  return doc;
};
