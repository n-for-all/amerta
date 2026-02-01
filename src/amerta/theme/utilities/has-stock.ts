import { Product } from "@/payload-types";

export const hasStock = (product: Product, quantity: number = 1): boolean => {
  // For simple products
  if (product.type === "simple") {
    // If tracking inventory, check quantity
    if (product.trackInventory) {
      return product.quantity ? product.quantity >= quantity : false;
    }
    // If not tracking inventory, assume in stock
    return true;
  }

  // For variant products
  if (product.type === "variant") {
    if (!product.variants || product.variants.length === 0) return false;
    let hasAvailableVariant = product.variants.some(({ quantity, trackInventory }) => {
      // Check if variant tracks inventory
      if (trackInventory) {
        return quantity && quantity >= quantity;
      }
      // If not tracking, assume in stock
      return true;
    });
    return hasAvailableVariant;
  }

  return false;
};
