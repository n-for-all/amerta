import { LocaleCode } from "@/amerta/localization/locales";
import { SalesChannel } from "@/payload-types";
import configPromise from "@payload-config";
import { getPayload } from "payload";

export const getProductsTags = async ({ page, locale, limit = 10 }, salesChannel: SalesChannel, enabledOnly: boolean = true) => {
  const payload = await getPayload({ config: configPromise });

  const result = await payload.find({
    collection: "product-tags",
    where: {
      salesChannels: { equals: salesChannel.id },
      ...(enabledOnly ? { _status: { equals: "published" } } : {}),
    },
    limit: limit,
    page: page,
    locale: locale as LocaleCode,
  });

  return result;
};
