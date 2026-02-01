import { Currency, SalesChannel } from "@/payload-types";
import { getCurrencyByCode } from "./get-currency-by-code";
import { getDefaultCurrency } from "./get-default-currency";

export const getCurrency = async (salesChannel: SalesChannel, code?: string): Promise<Currency> => {
  if (code) {
    const currency = await getCurrencyByCode(code, salesChannel);
    if (currency) {
      return currency;
    }
  }

  const defaultCurrency = getDefaultCurrency(salesChannel);
  if (defaultCurrency) {
    return defaultCurrency;
  }

  throw new Error("Default currency must be set");
};




