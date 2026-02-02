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
 * const res = await addToCart({ id: "123", title: "Shirt", price: 20 }, 2);
 */
export async function addToCart(product: { id: string; title: string; price: number }, quantity: number, variantOptions?: Array<{ option: string; value: string }>): Promise<{ cart: CartWithCalculations; error?: null } | { cart?: null; error: ApiError }> {
  try {
    const response = await fetch("/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
 * @param productId - The ID of the product to remove.
 * @param variantOptions - Optional array of variant option objects.
 * @returns The updated cart or an error object.
 * @example
 * const res = await removeFromCart("123");
 */
export async function removeFromCart(productId: string, variantOptions?: Array<{ option: string | ProductOption; value: string }> | null): Promise<{ cart: CartWithCalculations; error?: null } | { cart?: null; error: ApiError }> {
  try {
    const response = await fetch("/api/cart/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product: productId,
        variantOptions: (variantOptions || []).map((vo) => ({ option: typeof vo.option === "string" ? vo.option : vo.option.id, value: vo.value })),
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
        message: err instanceof Error ? err.message : "Failed to remove from cart",
      },
    };
  }
}

/**
 * Updates the quantity of a cart item or removes it if quantity is less than or equal to zero.
 * @param productId - The ID of the product to update.
 * @param quantity - The new quantity.
 * @param variantOptions - Optional array of variant option objects.
 * @returns The updated cart or an error object.
 * @example
 * const res = await updateQuantity("123", 3);
 */
export async function updateQuantity(productId: string, quantity: number, variantOptions?: Array<{ option: string | ProductOption; value: string }> | null): Promise<{ cart: CartWithCalculations; error?: null } | { cart?: null; error: ApiError }> {
  try {
    const response = await fetch("/api/cart/update-quantity", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product: productId,
        quantity,
        variantOptions: (variantOptions || []).map((vo) => ({ option: typeof vo.option === "string" ? vo.option : vo.option.id, value: vo.value })),
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
 * const res = await applyCoupon("SUMMER2024");
 */
export async function applyCoupon(code: string): Promise<{ cart: CartWithCalculations; error?: null } | { cart?: null; error: ApiError }> {
  try {
    const response = await fetch("/api/cart/apply-coupon", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
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
export async function removeCoupon(): Promise<{ cart: CartWithCalculations; error?: null } | { cart?: null; error: ApiError }> {
  try {
    const response = await fetch("/api/cart/remove-coupon", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
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
export async function fetchCart(): Promise<{ cart: CartWithCalculations | null; error?: null } | { cart?: null; error: ApiError }> {
  try {
    const response = await fetch("/api/cart/get", {
      method: "GET",
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
        message: err instanceof Error ? err.message : "Failed to fetch cart",
      },
    };
  }
}
