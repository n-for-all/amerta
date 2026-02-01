import { getPayload } from "payload";
import configPromise from "@payload-config";
import { getDefaultCurrency } from "./get-default-currency";
import { getOrderById } from "./get-order-by-id";
import { SalesChannel } from "@/payload-types";

export const createPayment = async ({ paymentMethodId, transactionId, gateway, amount, currency, status, orderId, rawResponse }: { paymentMethodId: string; transactionId: string; gateway: string; amount: number; currency: string; status: "pending" | "success" | "failed" | "refunded"; orderId: string; rawResponse: any; }) => {
  const order = await getOrderById({ id: orderId });
  if (!order) {
    throw new Error(`Order with ID ${orderId} not found`);
  }

  const orderCurrency = getDefaultCurrency(order.salesChannel as SalesChannel);
  if (!orderCurrency) {
    throw new Error("Default currency is not properly configured in this store");
  }

  const payload = await getPayload({ config: configPromise });
  const payment = await payload.create({
    collection: "payments",
    data: {
      order: order.id,
      amount: amount,
      currency: currency,
      amountInDefaultCurrency: order.total,
      defaultCurrency: orderCurrency.id,
      status: status,
      gateway: gateway,
      transactionId: transactionId,
      paymentMethod: paymentMethodId,
      rawResponse,
      salesChannel: (order.salesChannel as SalesChannel).id,
    },
  });

  return payment;
};
