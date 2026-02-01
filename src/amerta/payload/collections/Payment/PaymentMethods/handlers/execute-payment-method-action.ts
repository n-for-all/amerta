import { Currency, PaymentMethod } from "@/payload-types";
import { getPaymentAdapter } from "@/amerta/payments";
import { getCurrencyByCode } from "@/amerta/theme/utilities/get-currency-by-code";
import { getDefaultCurrency } from "@/amerta/theme/utilities/get-default-currency";
import { getExchangeRate } from "@/amerta/theme/utilities/get-exchange-rate";
import { getSalesChannel } from "@/amerta/theme/utilities/get-sales-channel";

const sendUncachedResponse = (status: number, body: any) => {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
};

export const executePaymentMethodAction = async (req) => {
  const { payload } = req;

  try {
    const { action, amount, orderId, currencyCode, paymentMethodId, paymentIntentId, redirectTo } = await req.json!();
    if (!paymentMethodId) {
      return sendUncachedResponse(400, {
        success: false,
        error: "Payment method ID is required",
      });
    }

    const paymentMethod: PaymentMethod = await payload.findByID({
      collection: "payment-method",
      id: paymentMethodId,
    });

    if (!paymentMethod) {
      return sendUncachedResponse(404, {
        success: false,
        error: "Payment method not found",
      });
    }

    const { type } = paymentMethod;
    const adapter = await getPaymentAdapter(type);
    if (!adapter) {
      return sendUncachedResponse(400, {
        success: false,
        error: "Payment adapter or action not found",
      });
    }

    const salesChannel = await getSalesChannel();
    const currency = await getCurrencyByCode(currencyCode, salesChannel!);
    if (!currency) {
      return sendUncachedResponse(400, {
        success: false,
        error: `Currency ${currencyCode.toUpperCase()} is not supported in this sales channel.`,
      });
    }

    const supportedCurrencies: Currency[] | null = (paymentMethod.currencies || []) as Currency[];
    if (supportedCurrencies === null || supportedCurrencies.length === 0) {
      return sendUncachedResponse(400, {
        success: false,
        error: `No currencies are configured for this payment method.`,
      });
    }
    const found = supportedCurrencies.find((c) => c.code?.toLowerCase() === currencyCode.toLowerCase());

    let exchangeRate = 1;
    let orderCurrency = currencyCode;
    //!if the currency is not found, we don need to convert it to a currency because it is not supported by the payment method
    if (!found) {
      const firstSupportedCurrency = supportedCurrencies[0]!;
      const defaultCurrency = getDefaultCurrency(salesChannel!);
      exchangeRate = getExchangeRate(defaultCurrency, firstSupportedCurrency, salesChannel!);
      orderCurrency = firstSupportedCurrency.code!.toUpperCase();
    }

    let orderAmount = amount;
    orderAmount = (amount * exchangeRate).toFixed(2);

    const result = await adapter.executeAction(action, { amount: orderAmount, orderId, currencyCode: orderCurrency, paymentIntentId, redirectTo }, paymentMethod);
    return sendUncachedResponse(200, {
      success: true,
      result,
      amount: orderAmount,
      currency: orderCurrency,
      exchangeRate,
    });
  } catch (error) {
    console.error("Error executing payment method action:", error);
    return sendUncachedResponse(500, {
      success: false,
      error: "Error executing payment method action",
    });
  }
};
