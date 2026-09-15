import { Currency } from "@/payload-types";
import { parseUnicode } from "./format-price";

export const formatCurrency = (currency: Currency | null): string => {
  const currencyFormat = currency?.format && currency.format.includes("{{amount}}") ? currency.format : currency?.symbolNative + "{{amount}}";
  return currencyFormat.indexOf("{{amount}}") !== -1 ? parseUnicode(currencyFormat.replace("{{amount}}", "")) : "";
};
