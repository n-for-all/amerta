import configPromise from "@payload-config";
import { getPayload } from "payload";
import { LocaleCode } from "@/amerta/localization/locales";
import { getSalesChannel } from "./get-sales-channel";

export const getProductsBy = async ({ limit = 12, page = 1, whereQuery = {}, sortQuery = [], locale }: { limit?: number; page?: number; whereQuery?: Record<string, any>; sortQuery?: string[]; locale: string }) => {
  const payload = await getPayload({ config: configPromise });
  if (typeof whereQuery["salesChannels"] === "undefined") {
    const salesChannel = await getSalesChannel();
    if (!whereQuery.and) whereQuery.and = [];
    whereQuery.and.push({ salesChannels: { in: [salesChannel!.id] } });
  }

  const productsResult = await payload.find({
    collection: "products",
    limit,
    page,
    where: whereQuery,
    sort: sortQuery,
    locale: locale as LocaleCode,
  });

  return productsResult;
};
