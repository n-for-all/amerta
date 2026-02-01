import { CollectionAfterChangeHook } from "payload";
import { revalidate } from "@/amerta/utilities/revalidate";

export const revalidateTag: CollectionAfterChangeHook = ({ doc, req: { payload } }) => {
  if (doc._status === "published") {
    revalidate({ payload, collection: "tags", slug: doc.slug });
  }

  return doc;
};
