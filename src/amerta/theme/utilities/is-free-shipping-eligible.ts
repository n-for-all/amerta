import { Shipping } from "@/payload-types";

/**
 * Check if order qualifies for free shipping
 */
export const isFreeShippingEligible = (shippingMethod: Shipping, orderSubtotal: number): boolean => {
  if (!shippingMethod.freeThreshold) return false;
  return shippingMethod.freeThreshold > 0 && orderSubtotal >= shippingMethod.freeThreshold;
};