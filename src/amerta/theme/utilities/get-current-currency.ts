import { Currency, SalesChannel } from "@/payload-types";
import { cookies } from "next/headers";
import { getCurrency } from "./get-currency";

export const getCurrentCurrency = async (salesChannel: SalesChannel): Promise<Currency> => {
  const cookieStore = await cookies();
  const currencyCode = cookieStore.get("currency")?.value;
  const currency = await getCurrency(salesChannel, currencyCode);
  return currency;
};