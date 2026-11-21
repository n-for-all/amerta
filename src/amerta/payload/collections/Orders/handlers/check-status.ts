/**
 * @module Collections/Orders/Handlers
 * @title Check Payment Status Handler
 * @description This handler checks the payment status of an order. It validates the request, decrypts the order key, and fetches the payment status accordingly.
 */

import { NextResponse } from "next/server";
import { getPayload, PayloadRequest } from "payload";
import config from "@payload-config";
import { decryptSignature } from "@/amerta/core/utilities/decrypt-signature";
import { getPaymentAdapter } from "@/amerta/payments";
import type { PaymentLookup } from "@/amerta/payments/types";
import { saveOrderPayment } from "@/amerta/core/utilities/save-order-payment";
import { getSalesChannel } from "@/amerta/core/utilities/get-sales-channel";
import { getCurrencyByCode } from "@/amerta/core/utilities/get-currency-by-code";
import { getDefaultCurrency } from "@/amerta/core/utilities/get-default-currency";
import { getExchangeRate } from "@/amerta/core/utilities/get-exchange-rate";

export const checkPaymentStatus = async (req: PayloadRequest) => {
  try {
    const searchParams = req.searchParams;
    const orderKey = searchParams.get("orderKey");

    if (!orderKey) return NextResponse.json({ error: "Missing Key" }, { status: 400 });

    // 1. Verify Security (Same logic as your page)
    const decryptedOrderKey = decryptSignature(decodeURIComponent(orderKey));
    if (!decryptedOrderKey) return NextResponse.json({ error: "Invalid Key" }, { status: 403 });

    const orderData = decryptedOrderKey.split(":")[0]!;
    const splitIndex = orderData.lastIndexOf("__");
    const orderId = orderData.substring(0, splitIndex);

    // 2. Fast DB Lookup
    const payload = await getPayload({ config });

    // Find the Payment associated with this order
    const {
      docs: [payment],
    } = await payload.find({
      collection: "payments",
      where: { order: { equals: orderId } },
      depth: 0, // Keep it fast
      limit: 1,
      overrideAccess: true,
    });

    const isPaid = payment && payment.status === "success";

    return NextResponse.json({
      isPaid,
      paymentAmount: payment?.amount,
      paymentStatus: payment?.status,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
};

/**
 * Admin "Check payment" button: asks the order's payment gateway what happened (paid, declined and why,
 * abandoned). If the gateway was paid but the store missed the confirmation (webhook lost, customer closed
 * the tab before the redirect), the payment is recorded now — which also moves the order to processing
 * and sends the order emails.
 */
export const lookupOrderPaymentHandler = async (req: PayloadRequest) => {
  const id = req.routeParams?.id as string;
  const { payload } = req;
  const order: any = await payload.findByID({ collection: "orders", id, depth: 1 }).catch(() => null);
  if (!order) return Response.json({ message: "Order not found" }, { status: 404 });

  const method: any = order.paymentMethod;
  if (!method || typeof method !== "object") return Response.json({ message: "This order has no payment method" }, { status: 400 });
  const adapter = getPaymentAdapter(method.type);
  if (!adapter?.lookupPayment) {
    return Response.json({ message: `${method.label || method.type} payments can't be checked online` }, { status: 400 });
  }

  let result: PaymentLookup;
  try {
    result = await adapter.lookupPayment(order, method);
  } catch (e: any) {
    console.error("Payment lookup failed", e);
    return Response.json({ message: e?.message || "Could not reach the payment gateway" }, { status: 502 });
  }

  let recorded = false;
  if (result.state === "paid" && result.paid) {
    const { docs } = await payload.find({ collection: "payments", where: { order: { equals: order.id }, status: { equals: "success" } }, limit: 1, depth: 0 });
    if (!docs.length) {
      const salesChannel = await getSalesChannel();
      const currencyDoc = await getCurrencyByCode(result.paid.currencyCode, salesChannel!);
      if (currencyDoc) {
        const rate = getExchangeRate(getDefaultCurrency(salesChannel!), currencyDoc, salesChannel!) || 1;
        await saveOrderPayment({
          orderId: order.id,
          transactionId: result.paid.transactionId,
          gateway: method.type,
          status: "success",
          amount: Math.round((result.paid.amount / rate) * 100) / 100,
          currency: currencyDoc.id,
          rawResponse: result.paid.raw,
          paymentMethodId: method.id,
        });
        recorded = true;
      }
    }
  }

  const { paid, ...rest } = result;
  return Response.json({ ...rest, transactionId: paid?.transactionId || null, recorded });
};
