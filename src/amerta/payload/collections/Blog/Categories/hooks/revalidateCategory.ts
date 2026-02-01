import { CollectionAfterChangeHook } from "payload";
import { revalidate } from "@/amerta/utilities/revalidate";

export const revalidateCategory: CollectionAfterChangeHook = ({ doc, req: { payload } }) => {
  if (doc._status === "published") {
    revalidate({ payload, collection: "categories", slug: doc.slug });
  }

  return doc;
};
