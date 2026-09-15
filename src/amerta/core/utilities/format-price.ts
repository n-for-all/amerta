import { Currency } from "@/payload-types";

export const parseUnicode = (str) => {
  if (!str) return '';
  return str.replace(/\\u([0-9a-fA-F]{4,})/g, (match, group) => {
    return String.fromCodePoint(parseInt(group, 16));
  });
};

export const formatPrice = (price: number, currency: Currency | null, exchangeRate: number): string => {
  let finalPrice = price || 0;
  finalPrice = finalPrice * (Number(exchangeRate) || 1);
  const currencyFormat = currency?.format && currency.format.includes("{{amount}}") ? currency.format : currency?.symbolNative + "{{amount}}";
  return currencyFormat.indexOf("{{amount}}") !== -1 ? parseUnicode(currencyFormat.replace("{{amount}}", finalPrice.toFixed(2))) : finalPrice.toFixed(2);
};
