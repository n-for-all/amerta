/**
 * @module Collections/Products/Hooks
 * @title Revalidate Product Hook
 * @description This module defines the hooks related to the products collections in Amerta, specifically the revalidation hook that triggers a cache purge for product pages when a product is published or updated. This ensures that users always see the most up-to-date information when viewing product pages.
 */

import { AfterChangeHook } from "node_modules/payload/dist/collections/config/types";
import { revalidate } from "@/amerta/utilities/revalidate";


// Revalidate the page in the background, so the user doesn't have to wait
// Notice that the hook itself is not async and we are not awaiting `revalidate`
// Only revalidate existing docs that are published
// Don't scope to `operation` in order to purge static demo pages
export const revalidateProduct: AfterChangeHook = ({ doc, req: { payload } }) => {
  if (doc._status === "published") {
    revalidate({ payload, collection: "products", slug: doc.slug });
  }

  return doc;
};
