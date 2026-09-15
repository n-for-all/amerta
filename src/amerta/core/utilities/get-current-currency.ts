import { Currency, SalesChannel } from "@/payload-types";
import { cookies } from "next/headers";
import { getCurrency } from "./get-currency";
import { getDefaultCurrency } from "./get-default-currency";

export const getCurrentCurrency = async (salesChannel: SalesChannel): Promise<Currency> => {
  const cookieStore = await cookies();
  const currencyCode = cookieStore.get("currency")?.value;
  let currency: Currency | null = null;
  try {
    currency = await getCurrency(salesChannel, currencyCode);
  } catch (e) {
    currency = await getDefaultCurrency(salesChannel);
  }
  return currency;
};
