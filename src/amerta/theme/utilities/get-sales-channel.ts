import { getPayload } from "payload";
import configPromise from "@payload-config";

export const getSalesChannel = async (isDefault: boolean = true, enabledOnly: boolean = true) => {
  const payload = await getPayload({ config: configPromise });
  const salesChannels = await payload.find({
    collection: "sales-channel",
    where: {
      isDefault: { equals: isDefault ? true : false },
      ...(enabledOnly ? { enabled: { equals: "1" } } : {}),
    },
    limit: 1,
  });

  if (salesChannels.totalDocs > 0) {
    return salesChannels.docs[0]!;
  }

  throw new Error("Default Sales channel not found, please add a default sales channel in the admin panel.");
};
