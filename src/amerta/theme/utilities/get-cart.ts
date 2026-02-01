import { Cart, Coupon } from "@/payload-types";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { CartWithCalculations } from "../types";
import { populateCartItems } from "./populate-cart-items";
import { calculateSubtotal } from "./calculate-subtotal";
import { calculateDiscount } from "./calculate-discount";

export function calculateTotal(subtotal: number, discount: number): number {
  return Math.max(0, subtotal - discount);
}

export const generateCartId = (): string => {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export async function getCart(cartId?: string): Promise<CartWithCalculations> {
  let createNewCart = false;
  if (!cartId) {
    cartId = generateCartId();
    createNewCart = true;
  }

  let cart: Cart | null = null;
  if (!createNewCart) {
    const payload = await getPayload({ config: configPromise });
    // Try to find existing cart
    const carts = await payload.find({
      collection: "cart",
      where: {
        cartId: { equals: cartId || "0" },
      },
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

  // Apply currency conversion to product prices
  const cartWithConvertedPrices = {
    ...cart,
    id: cart!.cartId!,
    status: cart!.status!,
    items: (cart!.items || []).map((item: any) => {
      if (item.product && typeof item.product === "object") {
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
    }),
  };

  const subtotal = calculateSubtotal(cartWithConvertedPrices.items || []);
  const discount = cartWithConvertedPrices.appliedCoupon ? calculateDiscount(subtotal, cartWithConvertedPrices.appliedCoupon as Coupon) : 0;
  const convertedTotal = calculateTotal(subtotal, discount);

  return {
    ...cartWithConvertedPrices,
    subtotal: subtotal,
    discount: discount,
    total: convertedTotal,
  };
}