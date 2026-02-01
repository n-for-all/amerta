import { Order } from "@/payload-types";
import { signOrder } from "./sign-order";

/**
 * Creates a signed order key for the given order.
 * @param order - The order object to generate a key for.
 * @returns The signed order key as a string.
 * @example
 * const key = await createOrderKey(orderObj);
 */
export const createOrderKey = async (order: Order): Promise<string> => {
  const orderKey = await signOrder(`${order.id}__${order.orderId}`);
  return orderKey;
};
