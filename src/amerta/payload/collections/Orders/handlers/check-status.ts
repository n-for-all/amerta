/**
 * @module Collections/Orders/Handlers
 * @title Check Payment Status Handler
 * @description This handler checks the payment status of an order. It validates the request, decrypts the order key, and fetches the payment status accordingly.
 */

import { NextResponse } from "next/server";
import { getPayload, PayloadRequest } from "payload";
import config from "@payload-config";
import { decryptSignature } from "@/amerta/theme/utilities/decrypt-signature";

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
