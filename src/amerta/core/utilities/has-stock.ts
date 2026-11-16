import { Product } from "@/payload-types";
import { bundleItemOptions, isInStock } from "./is-in-stock";

export const hasStock = (product: Product, qty: number = 1): boolean => {
  if (product.type === "bundle") {
    // The bundle itself and every included product must be in stock (they must be populated, i.e. read with depth >= 1)
    const items = product.bundleItems || [];
    const own = !product.trackInventory || (product.quantity ?? 0) >= qty;
    // Each customer choice needs at least one option in stock
    const choices = (product.bundleChoices || []).every((g) => (g.products || []).some((p) => typeof p === "object" && !!p && isInStock(p, null, (g.quantity || 1) * qty)));
    return own && choices && items.every((b) => typeof b.product === "object" && !!b.product && isInStock(b.product, bundleItemOptions(b.product, b.variant), (b.quantity || 1) * qty));
  }

  if (product.type === "simple") {
    if (product.trackInventory) {
      return product.quantity ? product.quantity >= qty : false;
    }

    return true;
  }

  if (product.type === "variant") {
    if (!product.variants || product.variants.length === 0) return false;
    const hasAvailableVariant = product.variants.some(({ quantity, trackInventory }) => {
      if (trackInventory) {
        return quantity && quantity >= qty;
      }

      return true;
    });
    return hasAvailableVariant;
  }

  return false;
};
