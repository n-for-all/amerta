import { Currency, SalesChannel } from "@/payload-types";

export const getCurrencyByCode = async (code: string, salesChannel: SalesChannel): Promise<Currency> => {
  const currency = salesChannel.currencies?.find(({currency}) => (currency as Currency).code!.toLowerCase() === code.toLowerCase())?.currency;
  if(!currency || typeof currency === "string") {
    throw new Error(`Currency ${code} is not set properly in the sales channel`);
  }
  return currency;
};