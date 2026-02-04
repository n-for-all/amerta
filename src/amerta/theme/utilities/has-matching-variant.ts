import { Product } from "@/payload-types";

/**
 * Check if the selected variant options match any existing product variant
 */
export const hasMatchingVariant = (product: Product, selectedOptions: Array<{ option: string; value: string }>): boolean => {
  if (!product.variants || product.variants.length === 0) {
    return false;
  }

  return product.variants.some((variant) => {
    if (!variant.variant) return false;
    return selectedOptions.every((selected) => {
      const variantOption = variant.variant?.[selected.option];
      return variantOption && variantOption.value === selected.value;
    });
  });
};
