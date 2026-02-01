/**
 * @module Cart
 * @title Calculate Coupon Discount
 */
/**
 * Calculates the discount amount for a coupon based on the subtotal.
 * @param coupon - The coupon object containing discount information.
 * @param subtotal - The subtotal amount before discount.
 * @returns The discount amount to apply.
 * @example
 * const discount = calculateCouponDiscount(couponObj, 100);
 */
export function calculateCouponDiscount(coupon: any, subtotal: number): number {
  if (coupon.minimumPurchase && subtotal < coupon.minimumPurchase) {
    return 0;
  }

  if (coupon.discountType === "fixed") {
    return coupon.discountValue || 0;
  } else if (coupon.discountType === "percentage") {
    return (subtotal * (coupon.discountValue || 0)) / 100;
  }

  return 0;
}

/**
 * Determines if a rule applies to the cart based on its trigger type and values.
 * @param rule - The rule object containing trigger information.
 * @param cartItems - Array of cart items to check against the rule.
 * @param subtotal - The subtotal amount of the cart.
 * @returns True if the rule applies, false otherwise.
 * @example
 * const applies = ruleApplies(ruleObj, cartItems, 150);
 */
export function ruleApplies(rule: any, cartItems: any[], subtotal: number): boolean {
  if (rule.triggerType === "min_amount") {
    if (subtotal < rule.triggerValue) return false;
  } else if (rule.triggerType === "min_quantity") {
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQuantity < rule.triggerValue) return false;
  } else if (rule.triggerType === "specific_product") {
    const hasProduct = cartItems.some((item) => {
      const itemProductId = typeof item.product === "string" ? item.product : item.product.id;
      const triggerProducts = Array.isArray(rule.triggerProducts) ? rule.triggerProducts : [rule.triggerProducts];
      return triggerProducts.some((p: any) => {
        const pId = typeof p === "string" ? p : p.id;
        return itemProductId === pId;
      });
    });
    if (!hasProduct) return false;
  } else if (rule.triggerType === "collection") {
    const hasCollection = cartItems.some((item) => {
      const product = typeof item.product === "object" ? item.product : null;
      if (!product) return false;
      const productCollections = Array.isArray(product.collections) ? product.collections : [product.collections];
      const triggerCollections = Array.isArray(rule.triggerCollection) ? rule.triggerCollection : [rule.triggerCollection];
      return triggerCollections.some((c: any) => {
        const cId = typeof c === "string" ? c : c.id;
        return productCollections.some((pc: any) => {
          const pcId = typeof pc === "string" ? pc : pc.id;
          return pcId === cId;
        });
      });
    });
    if (!hasCollection) return false;
  }

  return true;
}

// Helper: Evaluate cart rules
export async function evaluateCartRules(
  payload: any,
  cartItems: any[],
  subtotal: number,
): Promise<{
  applicableRules: any[];
  totalDiscount: number;
  freeDelivery: boolean;
  freeGifts: any[];
  messages: { upsell: string[]; active: string[] };
}> {
  const rules = await payload.find({
    collection: "cart-rules",
    where: {
      status: {
        equals: "active",
      },
    },
    limit: 1000,
  });

  const applicableRules: string[] = [];
  let totalDiscount = 0;
  let freeDelivery = false;
  const freeGifts: any[] = [];
  const upsellMessages: string[] = [];
  const activeMessages: string[] = [];

  const sortedRules = (rules.docs || []).sort((a: any, b: any) => (b.priority || 0) - (a.priority || 0));

  for (const rule of sortedRules) {
    const applies = ruleApplies(rule, cartItems, subtotal);

    if (applies) {
      applicableRules.push(rule.id);

      if (rule.ruleType === "free_delivery") {
        freeDelivery = true;
      } else if (rule.ruleType === "discount") {
        const discount = calculateCouponDiscount({ ...rule, discountType: rule.discountType, discountValue: rule.discountValue }, subtotal);
        totalDiscount += discount;
      } else if (rule.ruleType === "free_gift") {
        freeGifts.push({
          product: rule.freeGiftProduct,
          quantity: rule.freeGiftQuantity,
        });
      }

      if (rule.activeMessage) {
        activeMessages.push(rule.activeMessage);
      }
    } else {
      if (rule.triggerType === "min_amount" && rule.triggerValue) {
        const needed = rule.triggerValue - subtotal;
        if (needed > 0 && rule.upsellMessage) {
          upsellMessages.push(rule.upsellMessage.replace("{amount}", needed.toFixed(2)));
        }
      }
    }
  }

  return {
    applicableRules,
    totalDiscount,
    freeDelivery,
    freeGifts,
    messages: {
      upsell: upsellMessages,
      active: activeMessages,
    },
  };
}
