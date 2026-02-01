import { Shipping } from "@/payload-types";

/**
 * Calculates the shipping cost, tax, and total for a given shipping method.
 * @param shippingMethod - The shipping method object.
 * @returns Object containing cost, tax, and total.
 * @example
 * const shipping = calculateShipping(shippingMethodObj);
 */
export const calculateShipping = (shippingMethod: Shipping): { cost: number; tax: number; total: number } => {
  const cost = shippingMethod.cost || 0;
  const isTaxable = shippingMethod.taxable || false;
  const taxRate = isTaxable ? (shippingMethod.taxRate || 0) / 100 : 0;
  const tax = cost * taxRate;

  return {
    cost,
    tax,
    total: cost + tax,
  };
};
