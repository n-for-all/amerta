/**
 * @module Cart
 * @title Cart Rules
 * @description Automatic offers (cart rules): free delivery, discounts, free gifts and buy X get Y.
 * They are evaluated every time the cart is read (see getCart), so the cart, checkout and order always agree.
 */
import type { CartRule, Product } from "@/payload-types";
import { isInStock } from "./is-in-stock";

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
    return Math.min(coupon.discountValue || 0, subtotal);
  } else if (coupon.discountType === "percentage") {
    return (subtotal * (coupon.discountValue || 0)) / 100;
  }

  return 0;
}

type Id = string;
const idOf = (v: any): Id | null => (v == null ? null : typeof v === "object" ? v.id : v);
const idsOf = (v: any): Id[] => (Array.isArray(v) ? v : v ? [v] : []).map(idOf).filter(Boolean) as Id[];
const round = (n: number) => Math.round(n * 100) / 100;

/** Price actually charged for one unit of a cart line (sale price when valid). */
export const unitPrice = (item: any): number => {
  const sale = item.salePrice && item.salePrice > 0 && item.salePrice < item.price ? item.salePrice : null;
  return sale || item.price || 0;
};

/** Cart lines whose product is one of `productIds` / belongs to one of `collectionIds`. */
function matchingLines(rule: any, items: any[]): any[] {
  if (rule.triggerType === "specific_product") {
    const ids = idsOf(rule.triggerProducts);
    return items.filter((item) => ids.includes(idOf(item.product)!));
  }
  if (rule.triggerType === "collection") {
    const ids = idsOf(rule.triggerCollection);
    return items.filter((item) => {
      const product = typeof item.product === "object" ? item.product : null;
      return idsOf(product?.collections).some((c) => ids.includes(c));
    });
  }
  return items;
}

/**
 * Determines if a rule's trigger is met by the cart.
 * @param rule - The rule object containing trigger information.
 * @param cartItems - Array of cart items to check against the rule.
 * @param subtotal - The subtotal amount of the cart.
 * @returns True if the rule applies, false otherwise.
 * @example
 * const applies = ruleApplies(ruleObj, cartItems, 150);
 */
export function ruleApplies(rule: any, cartItems: any[], subtotal: number): boolean {
  if (!cartItems.length) return false;
  switch (rule.triggerType) {
    case "min_amount":
      return subtotal >= (rule.triggerValue || 0);
    case "min_quantity":
      return cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0) >= (rule.triggerValue || 0);
    case "specific_product":
    case "collection":
      return matchingLines(rule, cartItems).length > 0;
    default:
      return false;
  }
}

/** Whether the rule is switched on today, within its usage limit, and meant for this customer. */
export function ruleIsAvailable(rule: any, customer?: { id: Id; groups?: any } | null, now = new Date()): boolean {
  if (rule.status !== "active") return false;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (rule.startDate) {
    const start = new Date(rule.startDate);
    start.setHours(0, 0, 0, 0);
    if (start > today) return false;
  }
  if (rule.expiryDate) {
    const end = new Date(rule.expiryDate);
    end.setHours(0, 0, 0, 0);
    if (end < today) return false;
  }
  if (rule.usageLimit && (rule.timesUsed || 0) >= rule.usageLimit) return false;

  if (rule.applicability === "specific_customers") {
    return !!customer && idsOf(rule.customers).includes(customer.id);
  }
  if (rule.applicability === "customer_groups") {
    const groups = idsOf(customer?.groups);
    return idsOf(rule.customerGroups).some((g) => groups.includes(g));
  }
  return true;
}

/** A product given away, with its images (rules are read at depth 1, which leaves the images as ids). */
async function loadGiftProduct(payload: any, value: any): Promise<Product | null> {
  const id = idOf(value);
  if (!id) return null;
  const product = await payload.findByID({ collection: "products", id, depth: 1 }).catch(() => null);
  return product && product._status !== "draft" ? product : null;
}

/** Variant options for one unit of a product given away for free: the first variant in stock. */
function giftOptions(product: Product, quantity: number): { option: string; value: string }[] | null | undefined {
  if (product.type !== "variant") return isInStock(product, null, quantity) ? null : undefined;
  for (const v of product.variants || []) {
    const options = Object.entries(v.variant || {}).map(([option, value]) => ({
      option,
      value: String(typeof value === "object" && value !== null && "value" in value ? (value as any).value : value),
    }));
    if (options.length && isInStock(product, options, quantity)) return options;
  }
  return undefined; // nothing in stock
}

export type CartGift = {
  product: Product;
  quantity: number;
  variantOptions?: { option: string; value: string }[] | null;
  rule: Id;
};

export type AppliedCartRule = {
  id: Id;
  name: string;
  ruleType: CartRule["ruleType"];
  /** Money taken off by this rule (0 for free delivery and gifts) */
  discount: number;
};

export type CartRuleUpsell = {
  rule: Id;
  /** The rule's upsell message, with {amount} / {quantity} still in it (the theme formats the money) */
  message: string;
  /** What is still missing: an amount of money or a number of items */
  remaining: number;
  remainingType: "amount" | "quantity";
};

export type CartRulesResult = {
  discount: number;
  freeDelivery: boolean;
  gifts: CartGift[];
  appliedRules: AppliedCartRule[];
  messages: { upsell: CartRuleUpsell[]; active: string[] };
};

/** Money taken off by a "discount" rule: on the matching products, or on the whole cart for amount/quantity triggers. */
function discountFor(rule: any, items: any[], subtotal: number): number {
  const base = rule.triggerType === "specific_product" || rule.triggerType === "collection" ? matchingLines(rule, items).reduce((s, i) => s + unitPrice(i) * i.quantity, 0) : subtotal;
  if (rule.discountType === "percentage") return (base * Math.min(rule.discountValue || 0, 100)) / 100;
  if (rule.discountType === "fixed") return Math.min(rule.discountValue || 0, base);
  return 0;
}

/**
 * Buy X get Y. Every X units of the "buy" product (any product when empty) earn Y units of the "get" product
 * (the same product when empty). Units of the get product already in the cart are discounted; when the reward
 * is free, any units still owed are added as gifts.
 */
async function buyXGetY(rule: any, items: any[], payload: any): Promise<{ discount: number; gift?: CartGift; missing?: number }> {
  const buyQty = rule.buyXGetYBuyQuantity || 0;
  const getQty = rule.buyXGetYGetQuantity || 0;
  if (buyQty < 1 || getQty < 1) return { discount: 0 };

  const buyId = idOf(rule.buyXGetYBuyProduct);
  const getId = idOf(rule.buyXGetYGetProduct) || buyId;
  // Without a "buy" product, every product of the trigger counts (e.g. any coffee size)
  const buyLines = buyId ? items.filter((i) => idOf(i.product) === buyId) : matchingLines(rule, items);
  const buyCount = buyLines.reduce((s, i) => s + i.quantity, 0);
  const getLines = getId ? items.filter((i) => idOf(i.product) === getId) : [];
  const sameProduct = !!getId && getId === buyId;

  // Buying 2 to get 1 of the same product needs 3 in the cart; with a different reward, 2 earn the reward.
  const sets = sameProduct ? Math.floor(buyCount / (buyQty + getQty)) : Math.floor(buyCount / buyQty);
  if (sets < 1) return { discount: 0, missing: (sameProduct ? buyQty + getQty : buyQty) - buyCount };
  let owed = sets * getQty;

  // Discount the cheapest units first
  const units = getLines.flatMap((line) => Array.from({ length: line.quantity }, () => unitPrice(line))).sort((a, b) => a - b);
  let discount = 0;
  for (const price of units.slice(0, owed)) {
    if (rule.buyXGetYDiscountType === "free") discount += price;
    else if (rule.buyXGetYDiscountType === "percentage") discount += (price * Math.min(rule.buyXGetYDiscountValue || 0, 100)) / 100;
    else if (rule.buyXGetYDiscountType === "fixed") discount += Math.min(rule.buyXGetYDiscountValue || 0, price);
  }
  owed -= Math.min(owed, units.length);

  // A free reward that isn't in the cart yet is added as a gift
  if (owed > 0 && rule.buyXGetYDiscountType === "free" && getId && !sameProduct) {
    const product = await loadGiftProduct(payload, getId);
    if (product) {
      const variantOptions = giftOptions(product, owed);
      if (variantOptions !== undefined) return { discount, gift: { product, quantity: owed, variantOptions, rule: rule.id } };
    }
  }
  return { discount };
}

/**
 * Evaluates every active cart rule against the cart.
 * Discount rules don't add up unless they are marked "Combine with other discounts": otherwise only the
 * largest one applies. Free delivery and gifts always apply.
 * @param payload - Payload instance
 * @param cartItems - Populated cart lines (product objects, price, salePrice, quantity)
 * @param subtotal - Cart subtotal
 * @param customer - The logged-in customer (for customer-specific rules), if any
 * @param locale - Locale for rule descriptions and messages
 */
export async function evaluateCartRules(payload: any, cartItems: any[], subtotal: number, customer?: { id: Id; groups?: any } | null, locale?: string): Promise<CartRulesResult> {
  const result: CartRulesResult = { discount: 0, freeDelivery: false, gifts: [], appliedRules: [], messages: { upsell: [], active: [] } };
  const items = (cartItems || []).filter((i) => i && i.product && i.quantity > 0);
  if (!items.length) return result;

  const rules = await payload.find({
    collection: "cart-rules",
    where: { status: { equals: "active" } },
    sort: "-priority",
    depth: 1,
    limit: 200,
    locale,
  });

  const exclusiveDiscounts: { rule: any; amount: number }[] = [];
  const stackedDiscounts: { rule: any; amount: number }[] = [];
  const label = (rule: any) => rule.description || rule.name;

  for (const rule of rules.docs as any[]) {
    if (!ruleIsAvailable(rule, customer)) continue;

    if (!ruleApplies(rule, items, subtotal)) {
      // Tell the customer how close they are (amount / quantity triggers only)
      if (rule.upsellMessage && (rule.triggerType === "min_amount" || rule.triggerType === "min_quantity")) {
        const have = rule.triggerType === "min_amount" ? subtotal : items.reduce((s, i) => s + i.quantity, 0);
        const remaining = (rule.triggerValue || 0) - have;
        if (remaining > 0) {
          result.messages.upsell.push({ rule: rule.id, message: rule.upsellMessage, remaining: round(remaining), remainingType: rule.triggerType === "min_amount" ? "amount" : "quantity" });
        }
      }
      continue;
    }

    let applied = false;
    if (rule.ruleType === "free_delivery") {
      result.freeDelivery = true;
      result.appliedRules.push({ id: rule.id, name: label(rule), ruleType: rule.ruleType, discount: 0 });
      applied = true;
    } else if (rule.ruleType === "discount") {
      const amount = discountFor(rule, items, subtotal);
      if (amount > 0) {
        (rule.stackable ? stackedDiscounts : exclusiveDiscounts).push({ rule, amount });
        applied = true; // added to appliedRules below, once we know which discounts win
      }
    } else if (rule.ruleType === "free_gift") {
      const product = await loadGiftProduct(payload, rule.freeGiftProduct);
      const quantity = rule.freeGiftQuantity || 1;
      const variantOptions = product ? giftOptions(product, quantity) : undefined;
      if (product && variantOptions !== undefined) {
        result.gifts.push({ product, quantity, variantOptions, rule: rule.id });
        result.appliedRules.push({ id: rule.id, name: label(rule), ruleType: rule.ruleType, discount: 0 });
        applied = true;
      }
    } else if (rule.ruleType === "buy_x_get_y") {
      const { discount, gift, missing } = await buyXGetY(rule, items, payload);
      // Close to the reward: "Add 1 more to get … free"
      if (!discount && !gift && missing && missing > 0 && rule.upsellMessage) {
        result.messages.upsell.push({ rule: rule.id, message: rule.upsellMessage, remaining: missing, remainingType: "quantity" });
      }
      if (discount > 0 || gift) {
        if (discount > 0) stackedDiscounts.push({ rule, amount: discount });
        else result.appliedRules.push({ id: rule.id, name: label(rule), ruleType: rule.ruleType, discount: 0 });
        if (gift) result.gifts.push(gift);
        applied = true;
      }
    }

    if (applied && rule.activeMessage) result.messages.active.push(rule.activeMessage);
  }

  // Only the best non-combinable discount counts
  const best = exclusiveDiscounts.sort((a, b) => b.amount - a.amount)[0];
  const winners = [...(best ? [best] : []), ...stackedDiscounts];
  if (best) {
    // Messages of discount rules that lost to a bigger one are dropped
    const losers = new Set(exclusiveDiscounts.slice(1).map((d) => d.rule.activeMessage).filter(Boolean));
    result.messages.active = result.messages.active.filter((m) => !losers.has(m));
  }

  // Tiered discounts (2 items -10%, 3 items -15%): only point the customer to the nearest next tier
  const discountRuleIds = new Set((rules.docs as any[]).filter((r) => r.ruleType === "discount").map((r) => r.id));
  const nearest = new Map<string, CartRuleUpsell>();
  for (const upsell of result.messages.upsell.filter((u) => discountRuleIds.has(u.rule))) {
    const current = nearest.get(upsell.remainingType);
    if (!current || upsell.remaining < current.remaining) nearest.set(upsell.remainingType, upsell);
  }
  result.messages.upsell = result.messages.upsell.filter((u) => !discountRuleIds.has(u.rule) || nearest.get(u.remainingType) === u);

  let total = 0;
  for (const { rule, amount } of winners) {
    const capped = round(Math.min(amount, subtotal - total));
    if (capped <= 0) continue;
    total += capped;
    result.appliedRules.push({ id: rule.id, name: label(rule), ruleType: rule.ruleType, discount: capped });
  }
  result.discount = round(total);
  return result;
}

export type ProductOffer = { id: string; title: string; ruleType: string; gift?: { id: string; title: string; slug?: string | null; image?: any } | null };

/**
 * Active offers (cart rules) a product takes part in, for its product page: rules triggered by this product
 * or one of its collections, and Buy X Get Y rules where it is the product to buy.
 */
export async function getProductOffers(payload: any, product: { id: Id; collections?: any }, locale?: string): Promise<ProductOffer[]> {
  const collectionIds = idsOf(product.collections);
  const rules = await payload.find({
    collection: "cart-rules",
    where: {
      status: { equals: "active" },
      ruleType: { in: ["discount", "free_gift", "buy_x_get_y"] },
      or: [
        { and: [{ triggerType: { equals: "specific_product" } }, { triggerProducts: { in: [product.id] } }] },
        ...(collectionIds.length ? [{ and: [{ triggerType: { equals: "collection" } }, { triggerCollection: { in: collectionIds } }] }] : []),
        { buyXGetYBuyProduct: { equals: product.id } },
      ],
    },
    sort: "-priority",
    depth: 2,
    limit: 10,
    locale,
  });
  return (rules.docs as any[])
    .filter((rule) => ruleIsAvailable(rule, null) && (rule.applicability || "all") === "all")
    .map((rule) => {
      const giftDoc = rule.ruleType === "free_gift" ? rule.freeGiftProduct : rule.ruleType === "buy_x_get_y" ? rule.buyXGetYGetProduct : null;
      const gift = giftDoc && typeof giftDoc === "object" ? { id: giftDoc.id, title: giftDoc.title, slug: giftDoc.slug, image: (giftDoc.images || []).find((m: any) => m && typeof m === "object") || null } : null;
      return { id: rule.id, title: rule.description || rule.name, ruleType: rule.ruleType, gift };
    });
}
