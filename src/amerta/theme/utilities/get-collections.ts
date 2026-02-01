import { SalesChannel } from "@/payload-types";
import configPromise from "@payload-config";
import { getPayload } from "payload";

export const getCollections = async ({ page, locale, limit = 10 }, salesChannel: SalesChannel) => {
  const payload = await getPayload({ config: configPromise });

  const result = await payload.find({
    collection: "collections",
    where: {
      salesChannels: { equals: salesChannel.id },
      enabled: { equals: "1" },
    },
    limit: limit,
    page: page,
    locale: locale as any,
  });

  return result;
};
