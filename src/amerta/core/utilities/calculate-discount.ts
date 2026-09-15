import { Coupon } from "@/payload-types";

/**
 * Calculates the discount amount based on the coupon and subtotal.
 * @param subtotal - The order subtotal before discount.
 * @param appliedCoupon - The coupon object to apply, or null.
 * @returns The discount amount.
 * @example
 * const discount = calculateDiscount(100, couponObj);
 */
export function calculateDiscount(subtotal: number, appliedCoupon?: Coupon | null): number {
  if (!appliedCoupon) return 0;
  if (appliedCoupon.status !== "active") {
    return 0;
  }

  const startDate = appliedCoupon.startDate ? new Date(appliedCoupon.startDate) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  startDate?.setHours(0, 0, 0, 0);

  if (startDate && startDate > today) {
    return 0;
  }

  if (appliedCoupon.expiryDate) {
    const expiryDate = new Date(appliedCoupon.expiryDate);
    expiryDate.setHours(0, 0, 0, 0);
    if (expiryDate < today) {
      return 0;
    }
  }

  if (appliedCoupon.usageLimit && appliedCoupon.timesUsed >= appliedCoupon.usageLimit) {
    return 0;
  }

  if (appliedCoupon.discountType === "fixed") {
    return Math.min(appliedCoupon.discountValue || 0, subtotal);
  } else if (appliedCoupon.discountType === "percentage") {
    return (subtotal * (appliedCoupon.discountValue || 0)) / 100;
  }
  return 0;
}
