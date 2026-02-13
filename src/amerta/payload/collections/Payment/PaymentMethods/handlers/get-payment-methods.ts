/**
 * @module Collections/PaymentMethods/Handlers
 * @title Get Payment Methods
 * @description This module defines the handler for fetching payment methods in the Payment Methods collection in Amerta, including settings, confirmation, and execution of payment actions.
 */

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

export const getPaymentMethods = async (req) => {
  const { payload } = req;
  try {
    const salesChannel = await getSalesChannel();
    if (!salesChannel) {
      return sendUncachedResponse(400, {
        success: false,
        error: "Sales channel not found",
      });
    }
    const response = await payload.find({
      collection: "payment-method",
      where: {
        active: {
          equals: true,
        },
        salesChannels: {
          equals: salesChannel.id || "",
        },
      },
      limit: 100,
      sort: ["order"],
    });

    return sendUncachedResponse(200, {
      success: true,
      data: response.docs,
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return sendUncachedResponse(500, {
      success: false,
      error: "Failed to fetch active payment methods",
    });
  }
};
