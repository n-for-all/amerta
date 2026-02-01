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
