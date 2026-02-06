/**
 * @module Cart/addToCart
 */
import { ProductOption } from "@/payload-types";
import { ApiError, CartWithCalculations } from "../types";

/**
 * Adds a product to the cart or increments its quantity.
 * @param product - The product object containing id, title, and price.
 * @param quantity - The quantity to add.
 * @param variantOptions - Optional array of variant option objects.
 * @returns The updated cart or an error object.
 * @example
 * const res = await addToCart({ id: "123", title: "Shirt", price: 20 }, 2, [], "en-US");
 */
export async function addToCart(product: { id: string; title: string; price: number }, quantity: number, variantOptions: Array<{ option: string; value: string }>, locale: string): Promise<{ cart: CartWithCalculations; error?: null } | { cart?: null; error: ApiError }> {
  try {
    const response = await fetch("/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locale: locale,
        product: product.id,
        quantity,
        variantOptions: variantOptions || [],
      }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return { cart: data.cart };
  } catch (err) {
    return {
      error: {
        message: err instanceof Error ? err.message : "Failed to add to cart",
      },
    };
  }
}

/**
 * Removes a product from the cart.
 * @param itemId - The ID of the item to remove.
 * @param locale - The locale string.
 * @returns The updated cart or an error object.
 * @example
 * const res = await removeFromCart("123", "en-US");
 */
export async function removeFromCart(itemId: string, locale: string): Promise<{ cart: CartWithCalculations; error?: null } | { cart?: null; error: ApiError }> {
  try {
    const response = await fetch("/api/cart/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locale: locale,
        itemId: itemId,
      }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return { cart: data.cart };
  } catch (err) {
    return {
      error: {
        message: err instanceof Error ? err.message : "Failed to remove from cart",
      },
    };
  }
}

/**
 * Updates the quantity of a cart item or removes it if quantity is less than or equal to zero.
 * @param itemId - The ID of the item to update.
 * @param quantity - The new quantity.
 * @param locale - The locale string.
 * @returns The updated cart or an error object.
 * @example
 * const res = await updateQuantity("123", 3, "en-US");
 */
export async function updateQuantity(itemId: string, quantity: number, locale: string): Promise<{ cart: CartWithCalculations; error?: null } | { cart?: null; error: ApiError }> {
  try {
    const response = await fetch("/api/cart/update-quantity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        itemId: itemId,
        quantity,
        locale,
      }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return { cart: data.cart };
  } catch (err) {
    return {
      error: {
        message: err instanceof Error ? err.message : "Failed to update quantity",
      },
    };
  }
}

/**
 * Applies a coupon code to the cart.
 * @param code - The coupon code to apply.
 * @returns The updated cart or an error object.
 * @example
 * const res = await applyCoupon("SUMMER2024", "en-US");
 */
export async function applyCoupon(code: string, locale: string): Promise<{ cart: CartWithCalculations; error?: null } | { cart?: null; error: ApiError }> {
  try {
    const response = await fetch("/api/cart/apply-coupon", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code, locale }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return { cart: data.cart };
  } catch (err) {
    return {
      error: {
        message: err instanceof Error ? err.message : "Failed to apply coupon",
      },
    };
  }
}

/**
 * Removes the applied coupon from the cart.
 * @returns The updated cart or an error object.
 * @example
 * const res = await removeCoupon();
 */
export async function removeCoupon(locale: string): Promise<{ cart: CartWithCalculations; error?: null } | { cart?: null; error: ApiError }> {
  try {
    const response = await fetch("/api/cart/remove-coupon", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ locale }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `${response.status}`);
    }

    const data = await response.json();
    return { cart: data.cart };
  } catch (err) {
    return {
      error: {
        message: err instanceof Error ? err.message : "Failed to remove coupon",
      },
    };
  }
}

/**
 * Clears all items from the cart.
 * @returns The updated cart or an error object.
 * @example
 * const res = await clearCart();
 */
export async function clearCart(): Promise<{ cart: CartWithCalculations; error?: null } | { cart?: null; error: ApiError }> {
  try {
    const response = await fetch("/api/cart/clear", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return { cart: data.cart };
  } catch (err) {
    return {
      error: {
        message: err instanceof Error ? err.message : "Failed to clear cart",
      },
    };
  }
}

/**
 * Fetches the current cart from the server (uses cartId cookie automatically).
 * @returns The current cart or an error object.
 * @example
 * const res = await fetchCart();
 */
export async function fetchCart(locale: string): Promise<{ cart: CartWithCalculations | null; error?: null } | { cart?: null; error: ApiError }> {
  try {
    const response = await fetch("/api/cart/get?locale=" + locale, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return { cart: data.cart };
  } catch (err) {
    return {
      error: {
        message: err instanceof Error ? err.message : "Failed to fetch cart",
      },
    };
  }
}
