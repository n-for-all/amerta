import { Currency, SalesChannel } from "@/payload-types";

export const getDefaultCurrency: (salesChannel: SalesChannel) => Currency = (salesChannel) => {
  const defaultCurrency = salesChannel.currencies?.find((currency) => currency.isDefault)?.currency;
  let currency: Currency | null | undefined = null;
  if (typeof defaultCurrency !== "string") {
    currency = defaultCurrency;
  }

  if (!currency) {
    throw new Error("Default currency must be set in the sales channel");
  }

  return currency;
};
