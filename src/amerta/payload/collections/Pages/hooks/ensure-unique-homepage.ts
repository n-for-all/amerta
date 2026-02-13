/**
 * @module Collections/Pages/Hooks
 * @title Ensure Unique Homepage Hook
 * @description This hook ensures that only one page can be set as the homepage. If a page is marked as the front page, it updates all other pages to unset their front page status.
 */

import { CollectionAfterChangeHook } from "payload";

export const ensureUniqueHomepage: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (doc.isFrontPage === true) {
    await req.payload.update({
      collection: "pages",
      where: {
        isFrontPage: {
          equals: true,
        },
        id: {
          not_equals: doc.id,
        },
      },
      data: {
        isFrontPage: false,
      },
    });
  }
};
