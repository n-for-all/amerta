import { Currency, SalesChannel } from "@/payload-types";

export const getCurrencies = async (salesChannel: SalesChannel): Promise<Currency[]> => {
  const currencies = salesChannel.currencies.filter((cur) => typeof cur.currency !== "string").map((cur) => ({ ...(cur.currency as Currency), isDefault: cur.isDefault })) as Currency[];
  return currencies;
};