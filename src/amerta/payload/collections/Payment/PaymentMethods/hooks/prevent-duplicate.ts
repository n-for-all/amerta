/**
 * @module Collections/PaymentMethods/Hooks
 * @title Prevent Duplicate Payment Methods
 * @description This module defines a hook for preventing duplicate payment methods in the Payment Methods collection in Amerta, ensuring that each payment method type is unique per sales channel.
 */

import { CollectionBeforeChangeHook } from "payload";

export const preventDuplicate: CollectionBeforeChangeHook = async ({ data, req, operation, originalDoc }) => {
  const typeToCheck = data.type || originalDoc?.type;
  const channelToCheck = data.salesChannel || originalDoc?.salesChannel;

  if (typeToCheck && channelToCheck) {
    const duplicateCheck = await req.payload.find({
      collection: "payment-method",
      where: {
        and: [{ type: { equals: typeToCheck } }, { salesChannel: { equals: channelToCheck } }, operation === "update" ? { id: { not_equals: originalDoc.id } } : {}],
      },
      limit: 1,
    });

    if (duplicateCheck.totalDocs > 0) {
      throw new Error(`A payment method of type "${typeToCheck}" already exists for this Sales Channel.`);
    }
  }

  return data;
};
