import { NextResponse } from "next/server";
import { PayloadRequest } from "payload";
import { Order, PaymentMethod } from "@/payload-types";
import { createOrderKey } from "@/amerta/theme/utilities/create-order-key";
import { getURL } from "@/amerta/utilities/getURL";
import { getPaymentAdapter } from "@/amerta/payments";

export const executePaymentMethodCallback = async (req: PayloadRequest): Promise<Response> => {
  const { payload, routeParams } = req;

  // 1. MAJOR ERROR CHECK: Params
  // If we don't have these, we can't even construct the redirect URL.
  const { locale, orderId } = routeParams || {};
  if (!locale || !orderId) {
    console.error("Critical: Missing route params in callback");
    return NextResponse.redirect(new URL("/", req.url), 303);
  }

  try {
    const order: Order = await payload.findByID({
      collection: "orders",
      id: orderId as string,
    });

    if (!order) {
      console.error(`Critical: Order ${orderId} not found in callback`);
      return NextResponse.redirect(new URL(getURL("/checkout/error", locale as string), req.url), 303);
    }

    // -----------------------------------------------------------
    // 3. ADAPTER DELEGATION (The "Try" Block)
    // -----------------------------------------------------------
    try {
      const paymentMethod = order.paymentMethod as PaymentMethod;

      // Validation: Ensure Payment Method exists and is populated
      if (!paymentMethod || typeof paymentMethod !== "object") {
        throw new Error(`Order ${order.id} has no valid payment method linked.`);
      }

      const { type } = paymentMethod;
      const adapter = await getPaymentAdapter(type);

      if (!adapter) {
        throw new Error(`No adapter found for type: ${type}`);
      }

      console.log(`Executing callback for payment method: ${type}, order ID: ${order.id}`);

      if (adapter.callback) {
        await adapter.callback(req, order);
      } else {
        console.warn(`Adapter ${type} does not implement a callback method.`);
      }
    } catch (adapterError) {
      // ---------------------------------------------------------
      // 4. ERROR HANDLING (Log & Continue)
      // ---------------------------------------------------------
      // We catch payment errors here (e.g., Signature Mismatch, Payment Failed)
      // so we can still redirect the user to the "Order Received" page.
      console.error("Payment Adapter Callback Error:", adapterError);
    }

    // -----------------------------------------------------------
    // 5. FINAL REDIRECT
    // -----------------------------------------------------------
    // Whether the payment succeeded or failed, we send them to the Order Received page.
    // The page will look at the DB (which the adapter updated) to decide
    // whether to show "Thank You" or "Payment Pending/Failed".
    const orderKey = await createOrderKey(order as Order);
    const redirectPath = getURL(`/checkout/order-received/${orderKey}`, locale as string);

    return NextResponse.redirect(new URL(redirectPath, req.url), 303);
  } catch (criticalError) {
    console.error("Critical Callback Error:", criticalError);
    // return NextResponse.redirect(new URL("/", req.url), 303);
  }
};
