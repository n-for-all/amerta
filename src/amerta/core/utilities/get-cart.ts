import { Cart, Coupon } from "@/payload-types";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { CartWithCalculations } from "../types";
import { populateCartItems } from "./populate-cart-items";
import { calculateSubtotal } from "./calculate-subtotal";
import { calculateDiscount } from "./calculate-discount";
import { evaluateCartRules } from "./cart";
import { LocaleCode } from "@/amerta/localization/locales";

export function calculateTotal(subtotal: number, discount: number): number {
  return Math.max(0, subtotal - discount);
}

export const generateCartId = (): string => {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export async function getCart(cartId?: string | null, locale?: string): Promise<CartWithCalculations> {
  let createNewCart = false;
  if (!cartId) {
    cartId = generateCartId();
    createNewCart = true;
  }

  let cart: Cart | null = null;
  if (!createNewCart) {
    const payload = await getPayload({ config: configPromise });
    const carts = await payload.find({
      collection: "cart",
      where: {
        cartId: { equals: cartId || "0" },
      },
      locale: locale as LocaleCode,
      limit: 1,
    });

    if (carts.docs.length > 0) {
      cart = {
        ...(carts.docs[0] as Cart),
        items: await populateCartItems(carts.docs[0]?.items || [], payload),
      };
    } else {
      createNewCart = true;
    }
  }

  const hasItems = !cart || (cart.items || []).length > 0;

  if (createNewCart) {
    const payload = await getPayload({ config: configPromise });
    if (hasItems) {
      cart = (await payload.create({
        collection: "cart",
        data: {
          items: [],
          status: "active",
          cartId,
          expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0]!,
        },
        draft: false,
      })) as Cart;
    } else {
      cart = {
        id: "",
        cartId,
        items: [],
        status: "active",
        expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0]!,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
    }
  }
  
  const cartWithConvertedPrices = {
    ...cart,
    id: cart!.cartId!,
    status: cart!.status!,
    items: (cart!.items || []).map((item: any) => {
      if (item && item.product && typeof item.product === "object") {
        return {
          ...item,
          product: {
            ...item.product,
            price: item.price || 0,
            salePrice: item.salePrice || null,
          },
        };
      }
      return item;
    }).filter(Boolean),
  };

  const subtotal = calculateSubtotal(cartWithConvertedPrices.items || []);

  // Automatic offers (cart rules)
  const payload = await getPayload({ config: configPromise });
  let customer: { id: string; groups?: any } | null = null;
  const customerId = typeof cart!.customer === "object" ? cart!.customer?.id : cart!.customer;
  if (customerId) {
    customer = await payload.findByID({ collection: "customers", id: customerId, depth: 0, select: { groups: true } }).catch(() => null);
  }
  const rules = await evaluateCartRules(payload, cartWithConvertedPrices.items || [], subtotal, customer, locale);

  // The coupon applies to what is left after the offers. A coupon that can't be combined with other discounts
  // and an offer discount don't add up: the customer gets the larger of the two.
  const coupon = cartWithConvertedPrices.appliedCoupon as Coupon | null | undefined;
  let rulesDiscount = rules.discount;
  let couponDiscount = coupon && typeof coupon === "object" ? calculateDiscount(subtotal - rulesDiscount, coupon) : 0;
  let offers = rules.appliedRules;
  if (coupon && typeof coupon === "object" && coupon.canCombineWithProductDiscounts === false && rulesDiscount > 0) {
    const couponAlone = calculateDiscount(subtotal, coupon);
    if (couponAlone > rulesDiscount) {
      couponDiscount = couponAlone;
      rulesDiscount = 0;
      offers = offers.filter((o) => o.discount === 0);
    } else {
      couponDiscount = 0;
    }
  }
  const discount = Math.round(Math.min(subtotal, rulesDiscount + couponDiscount) * 100) / 100;
  const convertedTotal = calculateTotal(subtotal, discount);

  return {
    ...cartWithConvertedPrices,
    subtotal: subtotal,
    discount: discount,
    couponDiscount,
    rulesDiscount,
    total: convertedTotal,
    freeDelivery: rules.freeDelivery,
    gifts: rules.gifts,
    offers,
    offerMessages: rules.messages,
  };
}