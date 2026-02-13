/**
 * @module Collections/Orders/Hooks
 * @title Populate Ordered By Hook
 * @description This hook populates the `orderedBy` field with the current user's ID if the user is a customer and the field is not already set.
 */

import { FieldHook } from "payload";
import type { Order } from "@/payload-types";

export const populateOrderedBy: FieldHook<Order> = async ({ req, operation, value }) => {
  if ((operation === "create" || operation === "update") && !value) {
    if (req.user?.collection === "customers") {
      return req.user.id;
    }
  }

  return value;
};
