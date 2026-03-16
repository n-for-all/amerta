/**
 * @module Cart
 */
/**
 * Calculates the subtotal of cart items by summing up product prices times quantities.
 * @param items - Array of cart items.
 * @returns The subtotal amount.
 * @example
 * const subtotal = calculateSubtotal(cartItems);
 */
export function calculateSubtotal(items: any[]): number {
  if (!items || items.length === 0) return 0;

  return items.reduce((sum, item) => {
    const product = typeof item.product === "object" ? item.product : null;
    const salePrice = item.salePrice && item.salePrice > 0 && item.salePrice < item.price ? item.salePrice : null;
    const price = salePrice || item.price || (product ? product.price : 0);
    return sum + price * item.quantity;
  }, 0);
}
