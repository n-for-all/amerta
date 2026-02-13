/**
 * @module Collections/Cart/Hooks
 * @title Check Abandoned Cart Hook
 * @description This hook checks if a cart has expired and marks it as abandoned if necessary. The hook is triggered before a change is made to a cart document and updates the status based on the expiry date.
 */

import { CollectionBeforeChangeHook } from "payload";

export const checkAbandoned: CollectionBeforeChangeHook = async ({ data }) => {
  // Check if cart has expired
  if (data.expiryDate) {
    const expiryDate = new Date(data.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    // If expiry date is in the past and cart is still active, mark as abandoned
    if (expiryDate < today && data.status === "active") {
      data.status = "abandoned";
    }
  }

  return data;
};
