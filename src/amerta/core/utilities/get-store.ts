import { getPayload } from "payload";
import configPromise from "@payload-config";

export const getStore = async (enabledOnly: boolean = true) => {
  const payload = await getPayload({ config: configPromise });
  const stores = await payload.find({
    collection: "store",
    where: enabledOnly ? { enabled: { equals: "1" } } : undefined,
    limit: 1,
  });

  if (stores.totalDocs > 0) {
    return stores.docs[0];
  }

  throw new Error("Store not found");
};
