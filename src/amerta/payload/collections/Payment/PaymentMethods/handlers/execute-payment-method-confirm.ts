import { Currency, Order, PaymentMethod } from "@/payload-types";
import { getPaymentAdapter } from "@/amerta/payments";
import { getExchangeRate } from "@/amerta/theme/utilities/get-exchange-rate";
import { getSalesChannel } from "@/amerta/theme/utilities/get-sales-channel";
import { getURL } from "@/amerta/utilities/getURL";
import { createOrderKey } from "@/amerta/theme/utilities/create-order-key";
import { sendUncachedResponse } from "@/amerta/utilities/sendUncachedResponse";

export type ExecutePaymentMethodConfirmRequest = {
  orderId: string;
  locale: string;
};
export type ExecutePaymentMethodConfirmResponse = {
  error?: string;
  amount?: number;
  currency?: string;
  redirectTo?: string;
  billingAddress?: Order["billingAddress"];
};
export const executePaymentMethodConfirm = async (req): Promise<Response> => {
  const { payload } = req;

  try {
    const { orderId, locale } = (await req.json!()) as ExecutePaymentMethodConfirmRequest;
    const order: Order = await payload.findByID({
      collection: "orders",
      id: orderId,
    });

    if (!order) {
      return sendUncachedResponse(404, {
        success: false,
        error: "Order not found",
      });
    }

    if (!order.paymentMethod) {
      return sendUncachedResponse(404, {
        success: false,
        error: "Payment method not found",
      });
    }

    const { type, currencies } = order.paymentMethod as PaymentMethod;
    const adapter = await getPaymentAdapter(type);
    if (!adapter) {
      return sendUncachedResponse(400, {
        success: false,
        error: "Payment adapter or action not found",
      });
    }

    const supportedCurrencies: Currency[] | null = (currencies || []) as Currency[];
    if (supportedCurrencies === null || supportedCurrencies.length === 0) {
      return sendUncachedResponse(400, {
        success: false,
        error: `No currencies are configured for this payment method.`,
      });
    }
    const found = supportedCurrencies.find((c) => c.code?.toLowerCase() === (order.customerCurrency as Currency)?.code?.toLowerCase());

    let customerAmount = order.customerTotal;
    let customerCurrency = order.customerCurrency;
    if(!customerAmount || !customerCurrency) {
      return sendUncachedResponse(400, {
        success: false,
        error: `Payment amount or currency is missing from the order.`,
      });
    }

    let orderCurrency = customerCurrency;
    let orderAmount = customerAmount;

    //!if the currency is not found, we don need to convert it to a currency because it is not supported by the payment method
    if (!found) {
      const firstSupportedCurrency = supportedCurrencies[0]!;
      const salesChannel = await getSalesChannel();
      const exchangeRate = getExchangeRate(customerCurrency as Currency, firstSupportedCurrency, salesChannel!);
      orderCurrency = firstSupportedCurrency.code!.toUpperCase();
      orderAmount = (order.customerTotal * exchangeRate).toFixed(2) as unknown as number;
    }

    const orderKey = await createOrderKey(order);
    const redirectUrl = getURL(`/checkout/order-received/${orderKey}`, locale);

    const result = await adapter.confirm(orderAmount, orderCurrency, order.orderId!, redirectUrl, locale, order);
    if (!result.success) {
      throw new Error("Payment confirmation failed");
    }
    return sendUncachedResponse(200, {
      amount: orderAmount,
      currency: orderCurrency,
      redirectTo: result.redirectUrl,
      billingAddress: order.billingAddress,
    });
  } catch (error) {
    console.error("Error executing payment method action:", error);
    return sendUncachedResponse(500, {
      error: "Payment Failed, Please try again or contact support if the issue persists.",
    });
  }
};
