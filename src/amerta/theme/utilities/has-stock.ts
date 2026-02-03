import { Product } from "@/payload-types";

export const hasStock = (product: Product, qty: number = 1): boolean => {
  if (product.type === "simple") {
    if (product.trackInventory) {
      return product.quantity ? product.quantity >= qty : false;
    }

    return true;
  }

  if (product.type === "variant") {
    if (!product.variants || product.variants.length === 0) return false;
    let hasAvailableVariant = product.variants.some(({ quantity, trackInventory }) => {
      if (trackInventory) {
        return quantity && quantity >= qty;
      }

      return true;
    });
    return hasAvailableVariant;
  }

  return false;
};
