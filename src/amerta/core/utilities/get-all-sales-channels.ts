import { getPayload } from "payload";
import configPromise from "@payload-config";

export const getAllSalesChannels = async (enabledOnly: boolean = true) => {
  const payload = await getPayload({ config: configPromise });
  const salesChannels = await payload.find({
    collection: "sales-channel",
    where: {
      ...(enabledOnly ? { enabled: { equals: "1" } } : {}),
    },
    limit: 100,
  });

  if (salesChannels.totalDocs > 0) {
    return salesChannels.docs;
  }

  return [];
};
