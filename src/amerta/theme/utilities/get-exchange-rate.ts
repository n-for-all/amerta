import { Currency, SalesChannel } from "@/payload-types";

export const getExchangeRate = (fromCurrency: Currency, toCurrency: Currency, salesChannel: SalesChannel): number => {
  if (fromCurrency.code === toCurrency.code) {
    return 1;
  }

  if (!salesChannel) {
    throw new Error("Sales channel is required to get exchange rate");
  }

  if (salesChannel.currencies) {
    const fromSalesChannelCurrency = salesChannel.currencies.find((curr) => {
      const currencyObj = typeof curr.currency === "object" ? curr.currency : null;
      return currencyObj && currencyObj.code === fromCurrency.code;
    });
    const toSalesChannelCurrency = salesChannel.currencies.find((curr) => {
      const currencyObj = typeof curr.currency === "object" ? curr.currency : null;
      return currencyObj && currencyObj.code === toCurrency.code;
    });

    if (fromSalesChannelCurrency && toSalesChannelCurrency) {
      const fromRate = Number(fromSalesChannelCurrency.exchangeRate || 1);
      const toRate = Number(toSalesChannelCurrency.exchangeRate || 1);

      if(!fromSalesChannelCurrency.exchangeRate || !toSalesChannelCurrency.exchangeRate) {
        console.warn(`One of the currencies ${fromCurrency.code} or ${toCurrency.code} does not have an exchange rate defined in sales channel ${salesChannel.name}. Defaulting to 1.`);
      }

      return toRate / fromRate;
    } else {
      throw new Error(`Currencies not found in sales channel ${!fromSalesChannelCurrency ? fromCurrency : null} ${!toSalesChannelCurrency ? toCurrency : null}`);
    }
  }

  throw new Error("SalesChannel has no currencies defined");
};
