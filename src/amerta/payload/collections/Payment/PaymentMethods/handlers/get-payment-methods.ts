/**
 * @module Collections/PaymentMethods/Handlers
 * @title Get Payment Methods
 * @description This module defines the handler for fetching payment methods in the Payment Methods collection in Amerta, including settings, confirmation, and execution of payment actions.
 */

import { getSalesChannel } from "@/amerta/core/utilities/get-sales-channel";

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

/**
 * Gateway settings that must never reach a browser: secret/API keys and webhook secrets.
 * Publishable keys, test-mode flags and COD instructions stay (the checkout needs them).
 */
const SECRET_SETTING = /(secret|apikey|webhook)/i;

export function stripPaymentSecrets<T extends Record<string, any>>(doc: T): T {
  if (!doc || typeof doc !== "object") return doc;
  const clean: Record<string, any> = { ...doc };
  for (const [key, value] of Object.entries(clean)) {
    if (key.endsWith("Settings") && value && typeof value === "object") {
      clean[key] = Object.fromEntries(Object.entries(value).filter(([name]) => !SECRET_SETTING.test(name)));
    }
  }
  return clean as T;
}

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
      data: response.docs.map((doc) => stripPaymentSecrets(doc)),
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return sendUncachedResponse(500, {
      success: false,
      error: "Failed to fetch active payment methods",
    });
  }
};
