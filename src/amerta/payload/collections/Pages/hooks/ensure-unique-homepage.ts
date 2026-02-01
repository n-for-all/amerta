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
