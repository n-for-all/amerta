import { getPayload } from "payload";
import configPromise from "@payload-config";
import { getDefaultCurrency } from "./get-default-currency";
import { getOrderById } from "./get-order-by-id";
import { Customer, Payment, SalesChannel } from "@/payload-types";
import { sendNewOrderEmail } from "@/amerta/utilities/emails/sendOrderEmail";

export const saveOrderPayment = async ({
  paymentMethodId,
  transactionId,
  gateway,
  amount,
  currency,
  status,
  orderId,
  rawResponse,
}: {
  paymentMethodId: string;
  transactionId: string;
  gateway: string;
  amount: number;
  currency: string;
  status: "pending" | "success" | "failed" | "refunded";
  orderId: string;
  rawResponse: any;
}) => {
  const order = await getOrderById({ id: orderId });
  if (!order) {
    throw new Error(`Order with ID ${orderId} not found`);
  }

  const orderCurrency = getDefaultCurrency(order.salesChannel as SalesChannel);
  if (!orderCurrency) {
    throw new Error("Default currency is not properly configured in this store");
  }

  const payload = await getPayload({ config: configPromise });

  let payment: Payment | null = null;
  const existingPayment = await payload.find({
    collection: "payments",
    where: {
      order: {
        equals: orderId,
      },
    },
  });

  if (!existingPayment || existingPayment.totalDocs === 0) {
    payment = await payload.create({
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
  } else {
    payment = existingPayment.docs[0]!;
    payment = await payload.update({
      collection: "payments",
      id: payment.id,
      data: {
        amount: amount,
        currency: currency,
        amountInDefaultCurrency: order.total,
        defaultCurrency: orderCurrency.id,
        status: status,
        gateway: gateway,
        transactionId: transactionId,
        paymentMethod: paymentMethodId,
        rawResponse,
      },
    });
  }
  //send order confirmation email if payment is successful and order was pending
  if (status == "success" && order.status === "pending") {
    await payload.update({
      collection: "orders",
      id: orderId,
      data: { status: "processing", paidAt: new Date().toISOString() },
    });
    if (order.orderedBy) {
      try {
        await sendNewOrderEmail(order.orderedBy as Customer, order, false);
      } catch (e) {
        console.error("Error sending order confirmation email:", e);
      }
    }
  }

  return payment;
};
