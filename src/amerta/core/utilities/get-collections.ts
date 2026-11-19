import { LocaleCode } from "@/amerta/localization/locales";
import { SalesChannel } from "@/payload-types";
import configPromise from "@payload-config";
import { getPayload } from "payload";

/** Published collections of a sales channel; topLevelOnly leaves out subcollections (those with a parent) */
export const getCollections = async (
  { page, locale, limit = 10, topLevelOnly = false }: { page: number; locale: string; limit?: number; topLevelOnly?: boolean },
  salesChannel: SalesChannel,
) => {
  const payload = await getPayload({ config: configPromise });

  const result = await payload.find({
    collection: "collections",
    where: {
      salesChannels: { equals: salesChannel.id },
      _status: { equals: "published" },
      ...(topLevelOnly ? { or: [{ parent: { exists: false } }, { parent: { equals: null } }] } : {}),
    },
    sort: "title",
    limit: limit,
    page: page,
    locale: locale as LocaleCode,
  });

  return result;
};
