import { Product, ProductOption } from "@/payload-types";

export const getAvailableProductOptions = (
  product: Product,
  qty: number = 1,
):
  | {
      [optionId: string]: {
        value: string;
        name: string;
      };
    }[]
  | null => {
  if (product.type === "simple") {
    return null;
  }

  if (product.type === "variant") {
    if (!product.variants || product.variants.length === 0) return null;
    let hasAvailableVariant = product.variants
      .map(({ quantity, trackInventory, variant, stockStatus }) => {
        if (stockStatus !== "in_stock") return null;
        if (trackInventory) {
          if (quantity && quantity >= quantity) {
            return variant;
          }
          return null;
        }

        return variant;
      })
      .filter((v) => v !== undefined && v !== null);
    return hasAvailableVariant;
  }

  return [];
};
